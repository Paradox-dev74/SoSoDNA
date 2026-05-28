from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id
from app.core.database import get_db
from app.services.sync_service import SyncService

router = APIRouter()
sync_service = SyncService()


@router.post("/sync")
async def sync_sodex_data(
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await sync_service.sync_user_data(db, user_id)
