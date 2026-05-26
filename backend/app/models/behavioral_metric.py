import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy import JSON, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class BehavioralMetric(Base):
    __tablename__ = "behavioral_metrics"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), index=True)
    trade_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("trades.id"), nullable=True)
    period_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    period_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    liquidity_stress_index: Mapped[Decimal] = mapped_column(Numeric(8, 4))
    emotional_entry_score: Mapped[Decimal] = mapped_column(Numeric(8, 4))
    sweep_exposure_rating: Mapped[Decimal] = mapped_column(Numeric(8, 4))
    execution_precision_score: Mapped[Decimal] = mapped_column(Numeric(8, 4))
    revenge_trading_probability: Mapped[Decimal] = mapped_column(Numeric(8, 4))
    volatility_fragility_index: Mapped[Decimal] = mapped_column(Numeric(8, 4))
    overtrading_pressure: Mapped[Decimal] = mapped_column(Numeric(8, 4), default=0)
    loss_chase_intensity: Mapped[Decimal] = mapped_column(Numeric(8, 4), default=0)
    feature_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    model_version: Mapped[str] = mapped_column(String(32), default="v1")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="metrics")

