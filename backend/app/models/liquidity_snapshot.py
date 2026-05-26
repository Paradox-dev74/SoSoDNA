import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Numeric, String, func
from sqlalchemy import JSON
from sqlalchemy import Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class LiquiditySnapshot(Base):
    __tablename__ = "liquidity_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    symbol: Mapped[str] = mapped_column(String(32), index=True)
    market_type: Mapped[str] = mapped_column(String(16), default="perps")
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    mid_price: Mapped[Decimal] = mapped_column(Numeric(24, 8))
    best_bid: Mapped[Decimal] = mapped_column(Numeric(24, 8))
    best_ask: Mapped[Decimal] = mapped_column(Numeric(24, 8))
    spread_bps: Mapped[Decimal] = mapped_column(Numeric(12, 4))
    bid_depth_1pct: Mapped[Decimal] = mapped_column(Numeric(24, 8))
    ask_depth_1pct: Mapped[Decimal] = mapped_column(Numeric(24, 8))
    bid_depth_5pct: Mapped[Decimal] = mapped_column(Numeric(24, 8))
    ask_depth_5pct: Mapped[Decimal] = mapped_column(Numeric(24, 8))
    imbalance_score: Mapped[Decimal] = mapped_column(Numeric(12, 4))
    volatility_1m: Mapped[Decimal] = mapped_column(Numeric(12, 6))
    volatility_5m: Mapped[Decimal] = mapped_column(Numeric(12, 6))
    volatility_1h: Mapped[Decimal] = mapped_column(Numeric(12, 6))
    raw_orderbook: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

