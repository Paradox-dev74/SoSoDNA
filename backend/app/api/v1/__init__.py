from fastapi import APIRouter

from app.api.v1 import auth, dashboard, dna, health, heatmaps, insights, market, replay, risk, sodex, sosovalue, trades

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(dna.router, prefix="/dna", tags=["dna"])
api_router.include_router(trades.router, prefix="/trades", tags=["trades"])
api_router.include_router(insights.router, prefix="/insights", tags=["insights"])
api_router.include_router(replay.router, prefix="/replay", tags=["replay"])
api_router.include_router(heatmaps.router, prefix="/heatmaps", tags=["heatmaps"])
api_router.include_router(risk.router, prefix="/risk", tags=["risk"])
api_router.include_router(sodex.router, prefix="/sodex", tags=["sodex"])
api_router.include_router(sosovalue.router, prefix="/sosovalue", tags=["sosovalue"])
api_router.include_router(market.router, prefix="/market", tags=["market"])
