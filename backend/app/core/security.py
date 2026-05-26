import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

from eth_account import Account
from eth_account.messages import encode_defunct
from jose import JWTError, jwt

from app.core.config import get_settings

settings = get_settings()


def create_access_token(subject: str, extra: dict[str, Any] | None = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": subject, "exp": expire, "type": "access"}
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    payload = {"sub": subject, "exp": expire, "type": "refresh"}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])


def verify_access_token(token: str) -> dict[str, Any] | None:
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None
        return payload
    except JWTError:
        return None


def generate_nonce() -> str:
    return secrets.token_hex(32)


def build_auth_message(nonce: str, address: str, chain_id: int) -> str:
    return (
        f"Soso DNA Authentication\n"
        f"Address: {address.lower()}\n"
        f"Chain ID: {chain_id}\n"
        f"Nonce: {nonce}"
    )


def verify_wallet_signature(address: str, message: str, signature: str) -> bool:
    try:
        recovered = Account.recover_message(encode_defunct(text=message), signature=signature)
        return recovered.lower() == address.lower()
    except Exception:
        return False


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()
