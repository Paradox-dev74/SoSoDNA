from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class ReplayFrameResponse(BaseModel):
    timestamp: datetime
    price: Decimal
    spread_bps: Decimal
    depth_payload: dict | None
    regime_payload: dict | None
    ai_annotation: dict | None


class ReplaySessionResponse(BaseModel):
    id: UUID
    trade_id: UUID
    start_at: datetime
    end_at: datetime
    timeline_resolution_ms: int
    summary: dict | None
    frames: list[ReplayFrameResponse]
