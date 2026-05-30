from pydantic import BaseModel


class HeatmapPoint(BaseModel):
    price: float
    bid_depth: float
    ask_depth: float
    sweep_risk: float
    timestamp: str


class LiquidityHeatmapResponse(BaseModel):
    symbol: str
    points: list[HeatmapPoint]
    spread_centerline: list[dict]
    sweep_zones: list[dict]
    regime_overlays: list[dict]
