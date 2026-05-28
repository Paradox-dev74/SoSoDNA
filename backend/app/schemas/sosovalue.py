from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class SoSoValueEventResponse(BaseModel):
    id: UUID
    event_type: str
    source_id: str
    published_at: datetime
    symbols: list[str] | None
    sentiment_score: float | None = None
    importance_score: float | None = None
    title: str | None = None
    summary: str | None = None
    payload: dict | None = None

    model_config = {"from_attributes": True}


class MarketContextResponse(BaseModel):
    symbol: str
    pair_market: dict | None
    recent_news: list[SoSoValueEventResponse]
    macro_events: list[SoSoValueEventResponse]
    current_regime: str
    regime_confidence: float
