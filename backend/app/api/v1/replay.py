from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id
from app.core.database import get_db
from app.models.replay import ReplayFrame, ReplaySession
from app.models.trade import Trade
from app.replay.engine import MissingSnapshotError, ReplayEngine
from app.schemas.replay import ReplayFrameResponse, ReplaySessionResponse

router = APIRouter()
replay_engine = ReplayEngine()


@router.post("/trades/{trade_id}", response_model=ReplaySessionResponse)
async def create_replay(
    trade_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> ReplaySessionResponse:
    trade_result = await db.execute(select(Trade).where(Trade.id == trade_id, Trade.user_id == user_id))
    trade = trade_result.scalar_one_or_none()
    if not trade:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trade not found")

    existing = await db.execute(
        select(ReplaySession).where(ReplaySession.trade_id == trade_id, ReplaySession.user_id == user_id)
    )
    session = existing.scalar_one_or_none()
    if not session:
        try:
            session, frames = await replay_engine.create_session(db, user_id, trade)
        except MissingSnapshotError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(exc),
            ) from exc
    else:
        frames_result = await db.execute(
            select(ReplayFrame).where(ReplayFrame.replay_session_id == session.id).order_by(ReplayFrame.timestamp)
        )
        frames = frames_result.scalars().all()

    return ReplaySessionResponse(
        id=session.id,
        trade_id=session.trade_id,
        start_at=session.start_at,
        end_at=session.end_at,
        timeline_resolution_ms=session.timeline_resolution_ms,
        summary=session.summary,
        frames=[ReplayFrameResponse.model_validate(f) for f in frames],
    )


@router.get("/{session_id}", response_model=ReplaySessionResponse)
async def get_replay(
    session_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> ReplaySessionResponse:
    session_result = await db.execute(
        select(ReplaySession).where(ReplaySession.id == session_id, ReplaySession.user_id == user_id)
    )
    session = session_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Replay not found")

    frames_result = await db.execute(
        select(ReplayFrame).where(ReplayFrame.replay_session_id == session.id).order_by(ReplayFrame.timestamp)
    )
    frames = frames_result.scalars().all()

    return ReplaySessionResponse(
        id=session.id,
        trade_id=session.trade_id,
        start_at=session.start_at,
        end_at=session.end_at,
        timeline_resolution_ms=session.timeline_resolution_ms,
        summary=session.summary,
        frames=[ReplayFrameResponse.model_validate(f) for f in frames],
    )
