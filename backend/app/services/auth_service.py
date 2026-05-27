from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.redis_client import cache_delete, cache_get, cache_set
from app.core.security import (
    build_auth_message,
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_nonce,
    hash_token,
    verify_access_token,
    verify_wallet_signature,
)
from app.models.session import Session
from app.models.user import User
from app.models.wallet import Wallet
from app.schemas.auth import AuthNonceResponse, AuthVerifyRequest, AuthVerifyResponse, UserResponse

settings = get_settings()


class AuthService:
    async def create_nonce(self, address: str, chain_id: int) -> AuthNonceResponse:
        nonce = generate_nonce()
        message = build_auth_message(nonce, address, chain_id)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
        await cache_set(
            f"auth:nonce:{address.lower()}:{nonce}",
            {"message": message, "chain_id": chain_id},
            ttl=300,
        )
        return AuthNonceResponse(nonce=nonce, message=message, expires_at=expires_at)

    async def verify_and_login(self, db: AsyncSession, request: AuthVerifyRequest) -> AuthVerifyResponse:
        cache_key = f"auth:nonce:{request.address.lower()}:{request.nonce}"
        cached = await cache_get(cache_key)
        if not cached:
            raise ValueError("Invalid or expired nonce")

        if int(cached.get("chain_id", request.chain_id)) != request.chain_id:
            raise ValueError("Chain ID mismatch")

        message = cached["message"]
        if not verify_wallet_signature(request.address, message, request.signature):
            raise ValueError("Invalid signature")

        await cache_delete(cache_key)

        user, wallet = await self._get_or_create_user(db, request.address, request.chain_id)
        user.last_login_at = datetime.now(timezone.utc)
        wallet.verified_at = datetime.now(timezone.utc)

        access_token = create_access_token(str(user.id), {"wallet": request.address.lower()})
        refresh_token = create_refresh_token(str(user.id))

        session = Session(
            user_id=user.id,
            wallet_id=wallet.id,
            refresh_token_hash=hash_token(refresh_token),
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days),
        )
        db.add(session)
        await db.flush()

        return AuthVerifyResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.model_validate(user),
        )

    async def refresh_session(self, db: AsyncSession, refresh_token: str) -> AuthVerifyResponse:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise ValueError("Invalid refresh token")

        token_hash = hash_token(refresh_token)
        result = await db.execute(
            select(Session).where(
                Session.refresh_token_hash == token_hash,
                Session.revoked_at.is_(None),
            )
        )
        session = result.scalar_one_or_none()
        if not session or session.expires_at < datetime.now(timezone.utc):
            raise ValueError("Session expired")

        user = await self.get_user(db, session.user_id)
        if not user:
            raise ValueError("User not found")

        access_token = create_access_token(str(user.id))
        new_refresh = create_refresh_token(str(user.id))
        session.refresh_token_hash = hash_token(new_refresh)
        session.expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
        await db.flush()

        return AuthVerifyResponse(
            access_token=access_token,
            refresh_token=new_refresh,
            user=UserResponse.model_validate(user),
        )

    async def logout(self, db: AsyncSession, refresh_token: str) -> None:
        token_hash = hash_token(refresh_token)
        result = await db.execute(select(Session).where(Session.refresh_token_hash == token_hash))
        session = result.scalar_one_or_none()
        if session:
            session.revoked_at = datetime.now(timezone.utc)
            await db.flush()

    async def get_user_from_token(self, token: str) -> User | None:
        payload = verify_access_token(token)
        if not payload:
            return None
        return None

    async def _get_or_create_user(self, db: AsyncSession, address: str, chain_id: int) -> tuple[User, Wallet]:
        address = address.lower()
        result = await db.execute(select(Wallet).where(Wallet.address == address, Wallet.chain_id == chain_id))
        wallet = result.scalar_one_or_none()

        if wallet:
            user_result = await db.execute(select(User).where(User.id == wallet.user_id))
            user = user_result.scalar_one()
            return user, wallet

        user = User(primary_wallet_address=address, display_name=f"Trader {address[:6]}...{address[-4:]}")
        db.add(user)
        await db.flush()

        wallet = Wallet(user_id=user.id, chain_id=chain_id, address=address, wallet_type="evm")
        db.add(wallet)
        await db.flush()
        return user, wallet

    async def get_user(self, db: AsyncSession, user_id: UUID) -> User | None:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()
