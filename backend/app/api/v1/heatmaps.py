from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id
from app.core.database import get_db
from app.integrations.sodex.client import SYMBOL_ALIASES
from app.models.liquidity_snapshot import LiquiditySnapshot
from app.schemas.heatmap import HeatmapPoint, LiquidityHeatmapResponse

router = APIRouter()


@router.get("/liquidity", response_model=LiquidityHeatmapResponse)
async def get_liquidity_heatmap(
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
    symbol: str = "BTC-USD",
) -> LiquidityHeatmapResponse:
    symbol_candidates = [symbol, SYMBOL_ALIASES.get(symbol.upper(), symbol)]
    if symbol.upper() == "BTC-PERP":
        symbol_candidates.append("BTC-USD")

    snapshots = []
    for candidate in dict.fromkeys(symbol_candidates):
        result = await db.execute(
            select(LiquiditySnapshot)
            .where(LiquiditySnapshot.symbol == candidate)
            .order_by(LiquiditySnapshot.timestamp.desc())
            .limit(30)
        )
        snapshots = list(reversed(result.scalars().all()))
        if snapshots:
            symbol = candidate
            break

    if not snapshots:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No liquidity snapshots available. Run SoDEX sync after connecting wallet.",
        )

    points = [
        HeatmapPoint(
            price=float(s.mid_price),
            bid_depth=float(s.bid_depth_1pct),
            ask_depth=float(s.ask_depth_1pct),
            sweep_risk=float(s.imbalance_score) * 0.8,
            timestamp=s.timestamp.isoformat(),
        )
        for s in snapshots
    ]

    return LiquidityHeatmapResponse(
        symbol=symbol,
        points=points,
        spread_centerline=[
            {"timestamp": p.timestamp, "spread_bps": float(snapshots[i].spread_bps)}
            for i, p in enumerate(points)
        ],
        sweep_zones=[{"price": p.price, "risk": p.sweep_risk} for p in points if p.sweep_risk > 0.3],
        regime_overlays=[
            {
                "regime": "spread_expansion" if float(snapshots[i].spread_bps) > 10 else "stable_liquidity",
                "start": p.timestamp,
            }
            for i, p in enumerate(points)
            if float(snapshots[i].spread_bps) > 10
        ][:5],
    )
