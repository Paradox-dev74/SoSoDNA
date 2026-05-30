from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class AIInsightResponse(BaseModel):
    id: UUID
    insight_type: str
    severity: str
    title: str
    summary: str
    evidence: dict | None
    recommendations: dict | None
    confidence: Decimal
    trade_id: UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}
