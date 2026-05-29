from pydantic import BaseModel


class MetricTile(BaseModel):
    label: str
    value: str
    delta: str | None = None
    trend: str | None = None


class DashboardSummary(BaseModel):
    data_status: str
    trade_count: int
    net_pnl_usd: float
    behavioral_risk_score: float
    liquidity_stress_index: float
    execution_precision_score: float
    current_regime: str
    metrics: list[MetricTile]
    recent_insight_titles: list[str]
    message: str | None = None
