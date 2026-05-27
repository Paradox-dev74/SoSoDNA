from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class AuthNonceRequest(BaseModel):
    address: str = Field(..., min_length=42, max_length=42)
    chain_id: int = 138565


class AuthNonceResponse(BaseModel):
    nonce: str
    message: str
    expires_at: datetime


class AuthVerifyRequest(BaseModel):
    address: str
    signature: str
    nonce: str
    chain_id: int = 138565


class AuthVerifyResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: UUID
    display_name: str | None
    primary_wallet_address: str
    created_at: datetime

    model_config = {"from_attributes": True}
