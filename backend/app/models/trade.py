import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy import JSON, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Trade(Base):
    __tablename__ = "trades"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), index=True)
    sodex_account_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("sodex_accounts.id"), nullable=True)
    external_trade_id: Mapped[str] = mapped_column(String(128), index=True)
    symbol: Mapped[str] = mapped_column(String(32), index=True)
    symbol_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    market_type: Mapped[str] = mapped_column(String(16), default="perps")
    side: Mapped[str] = mapped_column(String(16))
    order_type: Mapped[str] = mapped_column(String(32), default="market")
    quantity: Mapped[Decimal] = mapped_column(Numeric(24, 8))
    price: Mapped[Decimal] = mapped_column(Numeric(24, 8))
    notional_usd: Mapped[Decimal] = mapped_column(Numeric(24, 8))
    fee_usd: Mapped[Decimal] = mapped_column(Numeric(24, 8), default=0)
    realized_pnl_usd: Mapped[Decimal | None] = mapped_column(Numeric(24, 8), nullable=True)
    opened_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    executed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    raw_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="trades")
    orders = relationship("Order", back_populates="trade", cascade="all, delete-orphan")


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trade_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("trades.id"), nullable=True)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), index=True)
    sodex_order_id: Mapped[str] = mapped_column(String(128), index=True)
    client_order_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    status: Mapped[str] = mapped_column(String(32))
    side: Mapped[str] = mapped_column(String(16))
    type: Mapped[str] = mapped_column(String(32))
    time_in_force: Mapped[str | None] = mapped_column(String(32), nullable=True)
    price: Mapped[Decimal | None] = mapped_column(Numeric(24, 8), nullable=True)
    quantity: Mapped[Decimal] = mapped_column(Numeric(24, 8))
    filled_quantity: Mapped[Decimal] = mapped_column(Numeric(24, 8), default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    raw_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    trade = relationship("Trade", back_populates="orders")

