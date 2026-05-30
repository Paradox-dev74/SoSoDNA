from pydantic import BaseModel, Field


class PreTradeRiskRequest(BaseModel):
    symbol: str = "BTC-USD"
    side: str = "long"
    size_usd: float = Field(gt=0)
    entry_price: float | None = None


class RiskContributor(BaseModel):
    factor: str
    impact: float
    description: str


class PreTradeRiskResponse(BaseModel):
    similarity_to_losing_setups: float
    severity: str
    title: str
    summary: str
    contributors: list[RiskContributor]
    recommended_action: str
    confidence: float
