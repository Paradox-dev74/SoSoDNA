from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id
from app.core.database import get_db
from app.core.redis_client import CacheUnavailableError
from app.schemas.auth import AuthNonceRequest, AuthNonceResponse, AuthVerifyRequest, AuthVerifyResponse, UserResponse
from app.services.auth_service import AuthService

router = APIRouter()
auth_service = AuthService()


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


@router.post("/nonce", response_model=AuthNonceResponse)
async def create_nonce(request: AuthNonceRequest) -> AuthNonceResponse:
    try:
        return await auth_service.create_nonce(request.address, request.chain_id)
    except CacheUnavailableError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e)) from e


@router.post("/verify", response_model=AuthVerifyResponse)
async def verify_signature(request: AuthVerifyRequest, db: AsyncSession = Depends(get_db)) -> AuthVerifyResponse:
    try:
        return await auth_service.verify_and_login(db, request)
    except CacheUnavailableError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e)) from e
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable. Check DATABASE_URL on Render (Neon PostgreSQL with SSL).",
        ) from e
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e)) from e


@router.post("/refresh", response_model=AuthVerifyResponse)
async def refresh_token(request: RefreshRequest, db: AsyncSession = Depends(get_db)) -> AuthVerifyResponse:
    try:
        return await auth_service.refresh_session(db, request.refresh_token)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e)) from e


@router.post("/logout")
async def logout(request: LogoutRequest, db: AsyncSession = Depends(get_db)) -> dict:
    await auth_service.logout(db, request.refresh_token)
    return {"status": "ok"}


@router.get("/me", response_model=UserResponse)
async def get_me(
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    user = await auth_service.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserResponse.model_validate(user)
