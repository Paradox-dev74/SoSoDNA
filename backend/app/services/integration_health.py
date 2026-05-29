import httpx
from sqlalchemy import text

from app.core.config import get_settings
from app.core.database import engine
from app.core.redis_client import get_redis

settings = get_settings()


async def get_integration_health() -> dict:
    db_ok = False
    redis_ok = False
    sodex_ok = False

    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            db_ok = True
    except Exception:
        db_ok = False

    try:
        client = await get_redis()
        if client:
            await client.ping()
            redis_ok = True
        elif settings.is_local:
            redis_ok = True
        else:
            redis_ok = False
    except Exception:
        redis_ok = False

    try:
        url = f"{settings.sodex_perps_rest.rstrip('/')}/markets/symbols"
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(url, headers={"Accept": "application/json"})
            if response.status_code == 200:
                payload = response.json()
                sodex_ok = payload.get("code") == 0 if isinstance(payload, dict) else True
            else:
                sodex_ok = False
    except Exception:
        sodex_ok = False

    api_key = settings.sosovalue_api_key.strip()
    return {
        "status": "ok" if db_ok and sodex_ok else "degraded",
        "service": "soso-dna",
        "app_env": settings.app_env,
        "demo_mode": settings.demo_mode,
        "integrations": {
            "database": db_ok,
            "redis": redis_ok,
            "sosovalue_api_key_configured": bool(api_key),
            "sodex_reachable": sodex_ok,
            "openai_configured": bool(settings.openai_api_key),
            "chain_id": settings.chain_id,
            "sodex_env": settings.sodex_env,
        },
    }
