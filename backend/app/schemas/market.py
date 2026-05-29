from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class MarketRegimeResponse(BaseModel):
    id: UUID
    symbol: str
    start_at: datetime
    end_at: datetime | None
    regime_type: str
    confidence: float
    features: dict | None

    model_config = {"from_attributes": True}
