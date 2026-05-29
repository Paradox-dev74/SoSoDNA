from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id
from app.core.database import get_db
from app.schemas.dna import TraderDnaProfile
from app.services.dna_service import DnaService

router = APIRouter()
dna_service = DnaService()


@router.get("/profile", response_model=TraderDnaProfile)
async def get_dna_profile(
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> TraderDnaProfile:
    return await dna_service.get_profile(db, user_id)
