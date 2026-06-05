import asyncio
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id
from app.core.database import get_db
from app.services.sync_service import SyncService

router = APIRouter()
sync_service = SyncService()
logger = logging.getLogger(__name__)

SYNC_TIMEOUT_SECONDS = 25.0


@router.post("/sync")
async def sync_sodex_data(
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    try:
        return await asyncio.wait_for(
            sync_service.sync_user_data(db, user_id),
            timeout=SYNC_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError as exc:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Sync timed out. External APIs were slow — try again in a few seconds.",
        ) from exc
    except SQLAlchemyError as exc:
        logger.exception("Database error during sync")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable during sync. Check DATABASE_URL on Render.",
        ) from exc
    except Exception as exc:
        logger.exception("Sync failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sync failed: {type(exc).__name__}",
        ) from exc
