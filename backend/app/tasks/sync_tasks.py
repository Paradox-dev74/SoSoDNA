import asyncio
from uuid import UUID

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings
from app.core.database import Base
from app.tasks.celery_app import celery_app

settings = get_settings()


@celery_app.task(name="sync_user_data")
def sync_user_data_task(user_id: str) -> dict:
    return asyncio.run(_async_sync(user_id))


async def _async_sync(user_id: str) -> dict:
    from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

    from app.services.sync_service import SyncService

    engine = create_async_engine(settings.database_url)
    async with AsyncSession(engine) as session:
        service = SyncService()
        result = await service.sync_user_data(session, UUID(user_id))
        await session.commit()
        return result
