from fastapi import APIRouter

from app.services.integration_health import get_integration_health

router = APIRouter()


@router.get("/integrations")
async def integration_health() -> dict:
    return await get_integration_health()
