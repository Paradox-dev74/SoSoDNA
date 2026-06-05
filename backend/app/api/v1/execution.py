from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id
from app.core.database import get_db
from app.integrations.sodex.errors import SodexApiError
from app.models.behavioral_metric import BehavioralMetric
from app.models.liquidity_snapshot import LiquiditySnapshot
from app.models.sosovalue_event import SoSoValueEvent
from app.models.trade import Trade
from app.integrations.sodex.client import SYMBOL_ALIASES
from app.risk.engine import RiskEngine
from app.schemas.execution import (
    ExecutionMarketResponse,
    OrderPreviewRequest,
    OrderPreviewResponse,
    OrderSubmitResponse,
    SignedOrderSubmitRequest,
)
from app.schemas.risk import PreTradeRiskRequest
from app.services.execution_service import ExecutionService

router = APIRouter()
execution_service = ExecutionService()
risk_engine = RiskEngine()


@router.get("/markets", response_model=list[ExecutionMarketResponse])
async def list_execution_markets(
    symbol: str | None = None,
    market_type: str = "perps",
    _user_id: UUID = Depends(get_current_user_id),
) -> list[ExecutionMarketResponse]:
    try:
        markets = await execution_service.list_markets(symbol, market_type=market_type)
        return [ExecutionMarketResponse(**m) for m in markets]
    except SodexApiError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=exc.message) from exc


@router.post("/preview", response_model=OrderPreviewResponse)
async def preview_order(
    request: OrderPreviewRequest,
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> OrderPreviewResponse:
    try:
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

        if not snapshot:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="No live orderbook snapshot available. Sync SoDEX data before placing orders.",
            )

        macro_result = await db.execute(
            select(SoSoValueEvent).where(SoSoValueEvent.event_type == "macro").limit(1)
        )
        macro_nearby = macro_result.scalar_one_or_none() is not None

        market_context = {
            "spread_bps": float(snapshot.spread_bps),
            "volatility_5m": float(snapshot.volatility_5m) if snapshot.volatility_5m else None,
            "macro_events_nearby": macro_nearby,
        }

        risk_request = PreTradeRiskRequest(
            symbol=request.symbol,
            side=request.side,
            size_usd=request.size_usd,
        )
        risk_response = risk_engine.evaluate_pretrade(
            risk_request,
            user_metrics,
            trades,
            market_context=market_context,
            liquidity_snapshot=snapshot,
        )

        return await execution_service.build_preview(
            db,
            user_id,
            request,
            risk_response=risk_response,
        )
    except HTTPException:
        raise
    except SodexApiError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=exc.message) from exc


@router.post("/submit", response_model=OrderSubmitResponse)
async def submit_signed_order(
    request: SignedOrderSubmitRequest,
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> OrderSubmitResponse:
    try:
        result = await execution_service.submit_signed_order(
            db,
            user_id,
            request_body=request.request_body,
            api_key_name=request.api_key_name,
            api_sign=request.api_sign,
            api_nonce=request.api_nonce,
            market_type=request.market_type,
        )
        return OrderSubmitResponse(**result)
    except SodexApiError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=exc.message) from exc
