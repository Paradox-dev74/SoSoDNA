from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id
from app.core.config import get_settings
from app.core.database import get_db
from app.core.live_constants import DEFAULT_SOSO_SYMBOL
from app.integrations.sosovalue.client import SoSoValueClient
from app.models.sosovalue_event import SoSoValueEvent
from app.schemas.sosovalue import MarketContextResponse, SoSoValueEventResponse

router = APIRouter()
settings = get_settings()
client = SoSoValueClient()


def _event_to_response(event: SoSoValueEvent) -> SoSoValueEventResponse:
    payload = event.payload or {}
    return SoSoValueEventResponse(
        id=event.id,
        event_type=event.event_type,
        source_id=event.source_id,
        published_at=event.published_at,
        symbols=event.symbols,
        sentiment_score=float(event.sentiment_score) if event.sentiment_score is not None else None,
        importance_score=float(event.importance_score) if event.importance_score is not None else None,
        title=payload.get("title") or payload.get("name"),
        summary=payload.get("summary") or payload.get("description"),
        payload=payload,
    )


@router.get("/events", response_model=list[SoSoValueEventResponse])
async def list_events(
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
    event_type: str | None = None,
    limit: int = 30,
) -> list[SoSoValueEventResponse]:
    query = select(SoSoValueEvent).order_by(SoSoValueEvent.published_at.desc()).limit(limit)
    if event_type:
        query = query.where(SoSoValueEvent.event_type == event_type)
    result = await db.execute(query)
    return [_event_to_response(e) for e in result.scalars().all()]


@router.get("/context", response_model=MarketContextResponse)
async def get_market_context(
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
    symbol: str = DEFAULT_SOSO_SYMBOL,
) -> MarketContextResponse:
    if not settings.sosovalue_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SoSoValue API key not configured",
        )

    news_result = await db.execute(
        select(SoSoValueEvent)
        .where(SoSoValueEvent.event_type == "news")
        .order_by(SoSoValueEvent.published_at.desc())
        .limit(5)
    )
    macro_result = await db.execute(
        select(SoSoValueEvent)
        .where(SoSoValueEvent.event_type == "macro")
        .order_by(SoSoValueEvent.published_at.desc())
        .limit(5)
    )

    from app.models.market_regime import MarketRegime

    regime_candidates = [f"{symbol}-USD", f"{symbol}-PERP"]
    regime = None
    for candidate in regime_candidates:
        regime_result = await db.execute(
            select(MarketRegime)
            .where(MarketRegime.symbol == candidate, MarketRegime.end_at.is_(None))
            .order_by(MarketRegime.start_at.desc())
            .limit(1)
        )
        regime = regime_result.scalar_one_or_none()
        if regime:
            break

    pair_market = await client.get_pair_market(symbol)

    return MarketContextResponse(
        symbol=symbol,
        pair_market=pair_market,
        recent_news=[_event_to_response(e) for e in news_result.scalars().all()],
        macro_events=[_event_to_response(e) for e in macro_result.scalars().all()],
        current_regime=regime.regime_type if regime else "unknown",
        regime_confidence=float(regime.confidence) if regime else 0.0,
    )
