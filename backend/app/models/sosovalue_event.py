import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, JSON, Numeric, String, func
from sqlalchemy import Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SoSoValueEvent(Base):
    __tablename__ = "sosovalue_events"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_type: Mapped[str] = mapped_column(String(32), index=True)
    source_id: Mapped[str] = mapped_column(String(128), index=True)
    published_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    symbols: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    sentiment_score: Mapped[Decimal | None] = mapped_column(Numeric(6, 4), nullable=True)
    importance_score: Mapped[Decimal | None] = mapped_column(Numeric(6, 4), nullable=True)
    payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

