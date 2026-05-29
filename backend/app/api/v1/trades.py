from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id
from app.core.database import get_db
from app.models.liquidity_snapshot import LiquiditySnapshot
from app.models.trade import Trade
from app.risk.engine import RiskEngine
from app.schemas.trade import TradeForensicsResponse, TradeResponse

router = APIRouter()
risk_engine = RiskEngine()


@router.get("", response_model=list[TradeResponse])
async def list_trades(
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
) -> list[TradeResponse]:
    result = await db.execute(
        select(Trade).where(Trade.user_id == user_id).order_by(Trade.executed_at.desc()).limit(limit)
    )
    return [TradeResponse.model_validate(t) for t in result.scalars().all()]


@router.get("/{trade_id}", response_model=TradeResponse)
async def get_trade(
    trade_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> TradeResponse:
    result = await db.execute(select(Trade).where(Trade.id == trade_id, Trade.user_id == user_id))
    trade = result.scalar_one_or_none()
    if not trade:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trade not found")
    return TradeResponse.model_validate(trade)


@router.get("/{trade_id}/forensics", response_model=TradeForensicsResponse)
async def get_trade_forensics(
    trade_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> TradeForensicsResponse:
    result = await db.execute(select(Trade).where(Trade.id == trade_id, Trade.user_id == user_id))
    trade = result.scalar_one_or_none()
    if not trade:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trade not found")

    all_trades_result = await db.execute(select(Trade).where(Trade.user_id == user_id))
    all_trades = all_trades_result.scalars().all()
    if not all_trades:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No imported trades available for forensics.",
        )

    metrics = risk_engine.compute_metrics_from_trades(all_trades)

    spread = None
    if trade.raw_payload and trade.raw_payload.get("spread_bps") is not None:
        spread = float(trade.raw_payload["spread_bps"])
    else:
        symbol_candidates = [trade.symbol]
        if trade.symbol == "BTC-PERP":
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
                spread = float(snapshot.spread_bps)
                break

    if spread is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No live spread evidence available for this trade.",
        )

    spread_values = [
        float(t.raw_payload.get("spread_bps"))
        for t in all_trades
        if t.raw_payload and t.raw_payload.get("spread_bps") is not None
    ]
    spread_percentile = None
    if spread_values:
        below = sum(1 for s in spread_values if s <= spread)
        spread_percentile = round((below / len(spread_values)) * 100, 1)

    losing_similar = [
        t for t in all_trades
        if t.realized_pnl_usd is not None and float(t.realized_pnl_usd) < 0
    ]
    win_rate = 1 - (len(losing_similar) / len(all_trades)) if all_trades else 0.0

    regime = "unknown"
    if trade.raw_payload and trade.raw_payload.get("regime"):
        regime = str(trade.raw_payload["regime"])
    elif spread > 10:
        regime = "spread_expansion"
    elif spread < 6:
        regime = "stable_liquidity"

    return TradeForensicsResponse(
        trade=TradeResponse.model_validate(trade),
        liquidity_stress_index=metrics["liquidity_stress_index"],
        emotional_entry_score=metrics["emotional_entry_score"],
        sweep_exposure_rating=metrics["sweep_exposure_rating"],
        execution_precision_score=metrics["execution_precision_score"],
        revenge_trading_probability=metrics["revenge_trading_probability"],
        volatility_fragility_index=metrics["volatility_fragility_index"],
        spread_at_entry_bps=spread,
        spread_percentile=spread_percentile or 0.0,
        regime=regime,
        similar_losing_trades=len(losing_similar),
        win_rate_similar_setups=win_rate,
    )
