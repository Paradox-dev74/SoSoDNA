import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy import Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Wallet(Base):
    __tablename__ = "wallets"
    __table_args__ = (UniqueConstraint("chain_id", "address", name="uq_wallet_chain_address"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), index=True)
    chain_id: Mapped[int] = mapped_column(Integer)
    address: Mapped[str] = mapped_column(String(42), index=True)
    wallet_type: Mapped[str] = mapped_column(String(32), default="evm")
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_nonce_issued_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="wallets")
    sodex_accounts = relationship("SodexAccount", back_populates="wallet", cascade="all, delete-orphan")

