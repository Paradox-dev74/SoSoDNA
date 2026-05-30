from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id
from app.core.database import get_db
from app.models.behavioral_metric import BehavioralMetric
from app.models.liquidity_snapshot import LiquiditySnapshot
from app.models.sosovalue_event import SoSoValueEvent
from app.models.trade import Trade
from app.integrations.sodex.client import SYMBOL_ALIASES
from app.risk.engine import RiskEngine
from app.schemas.risk import PreTradeRiskRequest, PreTradeRiskResponse

router = APIRouter()
risk_engine = RiskEngine()


@router.post("/pretrade", response_model=PreTradeRiskResponse)
async def evaluate_pretrade_risk(
    request: PreTradeRiskRequest,
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> PreTradeRiskResponse:
    trades_result = await db.execute(
        select(Trade).where(Trade.user_id == user_id).order_by(Trade.executed_at.desc()).limit(100)
    )
    trades = trades_result.scalars().all()

    metrics_result = await db.execute(
        select(BehavioralMetric)
        .where(BehavioralMetric.user_id == user_id, BehavioralMetric.trade_id.is_(None))
        .order_by(BehavioralMetric.created_at.desc())
        .limit(1)
    )
    metric_row = metrics_result.scalar_one_or_none()
    user_metrics = (
        {
            "liquidity_stress_index": float(metric_row.liquidity_stress_index),
            "emotional_entry_score": float(metric_row.emotional_entry_score),
            "sweep_exposure_rating": float(metric_row.sweep_exposure_rating),
            "execution_precision_score": float(metric_row.execution_precision_score),
            "revenge_trading_probability": float(metric_row.revenge_trading_probability),
            "volatility_fragility_index": float(metric_row.volatility_fragility_index),
        }
        if metric_row
        else risk_engine.compute_metrics_from_trades(trades)
    )

    symbol_candidates = [request.symbol, SYMBOL_ALIASES.get(request.symbol.upper(), request.symbol)]
    snapshot = None
    for candidate in dict.fromkeys(symbol_candidates):
        snapshot_result = await db.execute(
            select(LiquiditySnapshot)
            .where(LiquiditySnapshot.symbol == candidate)
            .order_by(LiquiditySnapshot.timestamp.desc())
            .limit(1)
        )
        snapshot = snapshot_result.scalar_one_or_none()
        if snapshot:
            break

    macro_result = await db.execute(
        select(SoSoValueEvent)
        .where(
            SoSoValueEvent.event_type == "macro",
            SoSoValueEvent.published_at >= datetime.now(timezone.utc) - timedelta(hours=24),
        )
        .limit(1)
    )
    macro_nearby = macro_result.scalar_one_or_none() is not None

    market_context = {
        "spread_bps": float(snapshot.spread_bps) if snapshot else None,
        "volatility_5m": float(snapshot.volatility_5m) if snapshot else 0.5,
        "macro_events_nearby": macro_nearby,
    }

    return risk_engine.evaluate_pretrade(
        request, user_metrics, trades, market_context=market_context, liquidity_snapshot=snapshot
    )
