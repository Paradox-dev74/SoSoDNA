from pydantic import BaseModel


class DnaMetric(BaseModel):
    key: str
    label: str
    value: float
    trend: float | None = None
    description: str


class TraderDnaProfile(BaseModel):
    data_status: str
    trade_count: int
    archetype: str
    risk_personality: str
    strengths: list[str]
    weaknesses: list[str]
    hidden_pnl_leaks: list[str]
    metrics: list[DnaMetric]
    behavioral_fingerprint: dict[str, float]
    message: str | None = None
