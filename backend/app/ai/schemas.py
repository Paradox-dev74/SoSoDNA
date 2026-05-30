from pydantic import BaseModel, Field


class EvidenceItem(BaseModel):
    metric: str
    value: float | str
    context: str


class ForensicInsightOutput(BaseModel):
    title: str
    claim: str
    evidence: list[EvidenceItem]
    market_context: dict[str, str | float]
    historical_pattern: dict[str, float | int | str]
    confidence: float = Field(ge=0, le=1)
    severity: str
    recommended_action: str
    not_financial_advice: bool = True
