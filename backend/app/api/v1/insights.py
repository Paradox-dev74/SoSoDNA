from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id
from app.core.database import get_db
from app.models.ai_insight import AIInsight
from app.schemas.insight import AIInsightResponse

router = APIRouter()


@router.get("", response_model=list[AIInsightResponse])
async def list_insights(
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
    limit: int = 20,
) -> list[AIInsightResponse]:
    result = await db.execute(
        select(AIInsight).where(AIInsight.user_id == user_id).order_by(AIInsight.created_at.desc()).limit(limit)
    )
    return [AIInsightResponse.model_validate(i) for i in result.scalars().all()]


@router.get("/{insight_id}", response_model=AIInsightResponse)
async def get_insight(
    insight_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> AIInsightResponse:
    result = await db.execute(
        select(AIInsight).where(AIInsight.id == insight_id, AIInsight.user_id == user_id)
    )
    insight = result.scalar_one_or_none()
    if not insight:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Insight not found")
    return AIInsightResponse.model_validate(insight)
