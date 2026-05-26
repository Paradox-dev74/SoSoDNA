import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, func
from sqlalchemy import JSON, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class SodexAccount(Base):
    __tablename__ = "sodex_accounts"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), index=True)
    wallet_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("wallets.id"), index=True)
    account_id: Mapped[int] = mapped_column(BigInteger, index=True)
    environment: Mapped[str] = mapped_column(String(16), default="testnet")
    market_type: Mapped[str] = mapped_column(String(16), default="perps")
    raw_state: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    wallet = relationship("Wallet", back_populates="sodex_accounts")

