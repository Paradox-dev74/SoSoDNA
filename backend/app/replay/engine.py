from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

from sqlalchemy import select

from app.models.liquidity_snapshot import LiquiditySnapshot
from app.models.replay import ReplayFrame, ReplaySession
from app.models.sosovalue_event import SoSoValueEvent


class MissingSnapshotError(Exception):
    """Raised when no orderbook snapshots exist for the replay window."""

    def __init__(self, symbol: str, trade_id: str | UUID) -> None:
        self.symbol = symbol
        self.trade_id = str(trade_id)
        super().__init__(
            f"No orderbook snapshots available for {symbol} around trade {self.trade_id}. "
            "Sync SoDEX data and ensure snapshots were imported."
        )


class ReplayEngine:
    """Build forensic replay timelines from stored trade and market data."""

    async def build_frames_from_data(
        self,
        db: Any,
        trade: Any,
        window_seconds: int = 60,
    ) -> list[dict[str, Any]]:
        executed_at = trade.executed_at
        if executed_at.tzinfo is None:
            executed_at = executed_at.replace(tzinfo=timezone.utc)

        start = executed_at - timedelta(seconds=window_seconds // 2)
        end = executed_at + timedelta(seconds=window_seconds // 2)

        symbol_candidates = [trade.symbol]
        if trade.symbol == "BTC-PERP":
            symbol_candidates.append("BTC-USD")
        elif trade.symbol == "BTC-USD":
            symbol_candidates.append("BTC-PERP")

        snapshots: list[LiquiditySnapshot] = []
        for candidate in dict.fromkeys(symbol_candidates):
            result = await db.execute(
                select(LiquiditySnapshot)
                .where(
                    LiquiditySnapshot.symbol == candidate,
                    LiquiditySnapshot.timestamp >= start,
                    LiquiditySnapshot.timestamp <= end,
                )
                .order_by(LiquiditySnapshot.timestamp)
            )
            snapshots = list(result.scalars().all())
            if snapshots:
                break

        if not snapshots:
            for candidate in dict.fromkeys(symbol_candidates):
                fallback = await db.execute(
                    select(LiquiditySnapshot)
                    .where(LiquiditySnapshot.symbol == candidate)
                    .order_by(LiquiditySnapshot.timestamp.desc())
                    .limit(1)
                )
                snap = fallback.scalar_one_or_none()
                if snap:
                    snapshots = [snap]
                    break

        if not snapshots:
            raise MissingSnapshotError(trade.symbol, trade.id)

        return self._frames_from_snapshots(trade, snapshots, executed_at)

    def _frames_from_snapshots(
        self,
        trade: Any,
        snapshots: list[LiquiditySnapshot],
        executed_at: datetime,
    ) -> list[dict[str, Any]]:
        frames: list[dict[str, Any]] = []
        for snap in snapshots:
            spread = float(snap.spread_bps)
            annotation = None
            if abs((snap.timestamp - executed_at).total_seconds()) < 2:
                annotation = {
                    "text": "Entry executed during observed liquidity conditions",
                    "severity": "critical" if spread > 10 else "watch",
                }
            elif spread > 10:
                annotation = {
                    "text": f"Spread expansion detected: {spread:.1f} bps",
                    "severity": "warning",
                }

            frames.append(
                {
                    "timestamp": snap.timestamp,
                    "price": snap.mid_price,
                    "spread_bps": snap.spread_bps,
                    "depth_payload": {
                        "bid_depth_1pct": float(snap.bid_depth_1pct),
                        "ask_depth_1pct": float(snap.ask_depth_1pct),
                        "imbalance": float(snap.imbalance_score),
                    },
                    "regime_payload": {
                        "regime": "spread_expansion" if spread > 10 else "stable_liquidity",
                        "volatility_5m": float(snap.volatility_5m),
                        "source": "sodex_orderbook_snapshot",
                    },
                    "ai_annotation": annotation,
                }
            )
        return frames

    async def create_session(
        self,
        db: Any,
        user_id: UUID,
        trade: Any,
    ) -> tuple[ReplaySession, list[ReplayFrame]]:
        frames_data = await self.build_frames_from_data(db, trade)

        events_result = await db.execute(
            select(SoSoValueEvent)
            .where(SoSoValueEvent.event_type.in_(["news", "macro"]))
            .order_by(SoSoValueEvent.published_at.desc())
            .limit(3)
        )
        context_events = events_result.scalars().all()

        start_at = frames_data[0]["timestamp"]
        end_at = frames_data[-1]["timestamp"]
        spread_peak = max(float(f["spread_bps"]) for f in frames_data)

        session = ReplaySession(
            user_id=user_id,
            trade_id=trade.id,
            start_at=start_at,
            end_at=end_at,
            timeline_resolution_ms=1000,
            summary={
                "primary_event": "liquidity_analysis",
                "spread_peak_bps": spread_peak,
                "data_source": "sodex_snapshots",
                "sosovalue_context_count": len(context_events),
            },
        )
        db.add(session)
        await db.flush()

        frame_models = []
        for frame in frames_data:
            model = ReplayFrame(
                replay_session_id=session.id,
                timestamp=frame["timestamp"],
                price=frame["price"],
                spread_bps=frame["spread_bps"],
                depth_payload=frame["depth_payload"],
                regime_payload=frame["regime_payload"],
                ai_annotation=frame["ai_annotation"],
            )
            db.add(model)
            frame_models.append(model)

        await db.flush()
        return session, frame_models
