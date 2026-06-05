import asyncio
import json
from uuid import UUID

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.ai.insight_engine import AIInsightEngine, InsufficientEvidenceError
from app.core.database import AsyncSessionLocal
from app.core.security import verify_access_token
from app.models.liquidity_snapshot import LiquiditySnapshot
from app.models.sosovalue_event import SoSoValueEvent, event_display_title
from app.models.ai_insight import AIInsight
from app.models.trade import Trade
from app.risk.engine import RiskEngine

ws_router = APIRouter()
insight_engine = AIInsightEngine()
risk_engine = RiskEngine()


class ConnectionManager:
    def __init__(self) -> None:
        self.active: dict[str, list[WebSocket]] = {}

    async def connect(self, channel: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active.setdefault(channel, []).append(websocket)

    def disconnect(self, channel: str, websocket: WebSocket) -> None:
        if channel in self.active:
            self.active[channel] = [ws for ws in self.active[channel] if ws != websocket]


manager = ConnectionManager()


@ws_router.websocket("/ws/user/{user_id}")
@ws_router.websocket("/api/ws/user/{user_id}")
async def user_stream(
    websocket: WebSocket,
    user_id: str,
    token: str = Query(...),
) -> None:
    payload = verify_access_token(token)
    if not payload or payload.get("sub") != user_id:
        await websocket.close(code=4401)
        return

    channel = f"user:{user_id}"
    await manager.connect(channel, websocket)
    try:
        await websocket.send_json({
            "type": "connection.established",
            "payload": {"user_id": user_id},
            "schema_version": "v1",
        })
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            if msg.get("type") == "ai.generate":
                await _stream_ai_insight(websocket, user_id, msg.get("payload", {}))
            elif msg.get("type") == "ping":
                await websocket.send_json({"type": "pong", "payload": {}})
    except WebSocketDisconnect:
        manager.disconnect(channel, websocket)


async def _stream_ai_insight(websocket: WebSocket, user_id: str, payload: dict) -> None:
    phases = [
        "Reading trade history",
        "Matching historical setups",
        "Checking liquidity regime",
        "Validating SoSoValue context",
        "Writing forensic conclusion",
    ]

    async with AsyncSessionLocal() as db:
        trades_result = await db.execute(
            select(Trade)
            .where(Trade.user_id == UUID(user_id))
            .order_by(Trade.executed_at.desc())
            .limit(50)
        )
        trades = trades_result.scalars().all()
        target_trade = next(
            (t for t in trades if t.realized_pnl_usd is not None and float(t.realized_pnl_usd) < 0),
            trades[0] if trades else None,
        )

        snapshot = None
        if target_trade:
            symbol_candidates = [target_trade.symbol]
            if target_trade.symbol == "BTC-PERP":
                symbol_candidates.append("BTC-USD")
            for candidate in symbol_candidates:
                snap_result = await db.execute(
                    select(LiquiditySnapshot)
                    .where(LiquiditySnapshot.symbol == candidate)
                    .order_by(LiquiditySnapshot.timestamp.desc())
                    .limit(1)
                )
                snapshot = snap_result.scalar_one_or_none()
                if snapshot:
                    break

        macro_result = await db.execute(
            select(SoSoValueEvent)
            .where(SoSoValueEvent.event_type.in_(["macro", "news"]))
            .order_by(SoSoValueEvent.published_at.desc())
            .limit(1)
        )
        macro_event = macro_result.scalar_one_or_none()

        metrics = risk_engine.compute_metrics_from_trades(trades)
        spread_values = [
            float(t.raw_payload.get("spread_bps"))
            for t in trades
            if t.raw_payload and t.raw_payload.get("spread_bps") is not None
        ]
        spread_percentile = None
        if snapshot and spread_values:
            current = float(snapshot.spread_bps)
            below = sum(1 for s in spread_values if s <= current)
            spread_percentile = round((below / len(spread_values)) * 100, 1)

        losing_similar = [
            t for t in trades
            if t.realized_pnl_usd is not None and float(t.realized_pnl_usd) < 0
        ]
        win_rate = 1 - (len(losing_similar) / len(trades)) if trades else None

        market_context = {
            "spread_bps": float(snapshot.spread_bps) if snapshot else None,
            "spread_percentile": spread_percentile,
            "volatility_5m": float(snapshot.volatility_5m) if snapshot else None,
            "regime": "spread_expansion" if snapshot and float(snapshot.spread_bps) > 10 else "stable_liquidity",
            "similar_losing_trades": len(losing_similar),
            "win_rate_similar_setups": win_rate,
            "sosovalue_event_title": event_display_title(macro_event),
        }

        blockers = insight_engine.assess_evidence(target_trade, metrics, market_context, macro_event)
        if blockers:
            await websocket.send_json({
                "type": "ai.insufficient_evidence",
                "payload": {
                    "message": "Insufficient live evidence to complete forensic insight.",
                    "blockers": blockers,
                },
            })
            return

        try:
            output = await insight_engine.generate_trade_forensics(
                target_trade, metrics, market_context, macro_event
            )
        except InsufficientEvidenceError as exc:
            await websocket.send_json({
                "type": "ai.insufficient_evidence",
                "payload": {
                    "message": str(exc),
                    "blockers": [str(exc)],
                },
            })
            return

        db_payload = insight_engine.to_db_payload(output, target_trade.id if target_trade else None)
        insight_row = AIInsight(
            user_id=UUID(user_id),
            trade_id=db_payload.get("trade_id"),
            insight_type=db_payload["insight_type"],
            severity=db_payload["severity"],
            title=db_payload["title"],
            summary=db_payload["summary"],
            evidence=db_payload["evidence"],
            recommendations=db_payload["recommendations"],
            confidence=db_payload["confidence"],
        )
        db.add(insight_row)
        await db.commit()
        await db.refresh(insight_row)

    await websocket.send_json({"type": "ai.reasoning_started", "payload": {"user_id": user_id}})
    for i, phase in enumerate(phases):
        await websocket.send_json({
            "type": "ai.phase_changed",
            "payload": {"phase": phase, "progress": (i + 1) / len(phases)},
        })
        await asyncio.sleep(0.35)
        if i == 2 and snapshot:
            await websocket.send_json({
                "type": "ai.evidence_found",
                "payload": {
                    "trade_id": str(target_trade.id),
                    "spread_bps": float(snapshot.spread_bps),
                    "source": "sodex_orderbook_snapshot",
                },
            })
        elif i == 3 and macro_event:
            await websocket.send_json({
                "type": "ai.evidence_found",
                "payload": {
                    "sosovalue_event": event_display_title(macro_event),
                    "importance": float(macro_event.importance_score or 0),
                    "source": "sosovalue_api",
                },
            })

    await websocket.send_json({
        "type": "ai.insight_completed",
        "payload": {
            "id": str(insight_row.id),
            "title": output.title,
            "claim": output.claim,
            "confidence": output.confidence,
            "severity": output.severity,
            "evidence": [e.model_dump() for e in output.evidence],
            "trade_id": str(target_trade.id),
        },
    })
