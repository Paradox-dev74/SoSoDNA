from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id
from app.core.database import get_db
from app.core.live_constants import normalize_sodex_symbol
from app.models.market_regime import MarketRegime
from app.schemas.market import MarketRegimeResponse

router = APIRouter()


@router.get("/regimes", response_model=list[MarketRegimeResponse])
async def list_regimes(
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
    symbol: str = "BTC-USD",
) -> list[MarketRegimeResponse]:
    normalized = normalize_sodex_symbol(symbol)
    symbol_candidates = list(dict.fromkeys([normalized, symbol]))

    regimes = []
    for candidate in symbol_candidates:
        result = await db.execute(
            select(MarketRegime)
            .where(MarketRegime.symbol == candidate)
            .order_by(MarketRegime.start_at.desc())
            .limit(20)
        )
        regimes = result.scalars().all()
        if regimes:
            break

    return [
        MarketRegimeResponse(
            id=r.id,
            symbol=r.symbol,
            start_at=r.start_at,
            end_at=r.end_at,
            regime_type=r.regime_type,
            confidence=float(r.confidence),
            features=r.features,
        )
        for r in regimes
    ]
