import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, func
from sqlalchemy import JSON, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ReplaySession(Base):
    __tablename__ = "replay_sessions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), index=True)
    trade_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("trades.id"), index=True)
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    timeline_resolution_ms: Mapped[int] = mapped_column(Integer, default=1000)
    summary: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ReplayFrame(Base):
    __tablename__ = "replay_frames"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    replay_session_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("replay_sessions.id"), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    price: Mapped[Decimal] = mapped_column(Numeric(24, 8))
    spread_bps: Mapped[Decimal] = mapped_column(Numeric(12, 4))
    depth_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    regime_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ai_annotation: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

