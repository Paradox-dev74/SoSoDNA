import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_router
from app.core.config import get_settings
from app.core.database import Base, engine
from app.middleware.rate_limit import RateLimitMiddleware
from app.services.integration_health import get_integration_health
from app.ws.router import ws_router

settings = get_settings()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.is_local:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Local mode: database tables ensured via create_all")
    else:
        logger.info("Production mode: expecting Alembic migrations to manage schema")
    yield


app = FastAPI(
    title="Soso DNA API",
    description="Behavioral Market Forensics for SoDEX Traders",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(RateLimitMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
app.include_router(ws_router)


@app.get("/health")
async def health() -> dict:
    return await get_integration_health()
