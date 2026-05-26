import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy import Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    display_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    primary_wallet_address: Mapped[str] = mapped_column(String(42), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    risk_disclaimer_accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    wallets = relationship("Wallet", back_populates="user", cascade="all, delete-orphan")
    trades = relationship("Trade", back_populates="user", cascade="all, delete-orphan")
    insights = relationship("AIInsight", back_populates="user", cascade="all, delete-orphan")
    metrics = relationship("BehavioralMetric", back_populates="user", cascade="all, delete-orphan")

