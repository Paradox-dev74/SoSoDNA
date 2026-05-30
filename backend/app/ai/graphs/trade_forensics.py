"""LangGraph-style forensic analysis pipeline (structured nodes)."""
from typing import Any, TypedDict

from app.ai.insight_engine import AIInsightEngine
from app.risk.engine import RiskEngine


class ForensicsState(TypedDict):
    trade: Any
    trades: list[Any]
    metrics: dict[str, float]
    market_context: dict[str, Any]
    output: dict[str, Any] | None


class TradeForensicsGraph:
    """Deterministic graph with optional LLM enhancement."""

    def __init__(self) -> None:
        self.risk_engine = RiskEngine()
        self.ai_engine = AIInsightEngine()

    async def normalize(self, state: ForensicsState) -> ForensicsState:
        state["metrics"] = self.risk_engine.compute_metrics_from_trades(state["trades"])
        return state

    async def score(self, state: ForensicsState) -> ForensicsState:
        trade = state["trade"]
        spread = float(trade.raw_payload.get("spread_bps", 12.4)) if trade.raw_payload else 12.4
        state["market_context"] = {
            "spread_bps": spread,
            "spread_percentile": 82,
            "similar_losing_trades": 14,
            "win_rate_similar_setups": 0.21,
            "regime": "spread_expansion",
        }
        return state

    async def reason(self, state: ForensicsState) -> ForensicsState:
        output = await self.ai_engine.generate_trade_forensics(
            state["trade"], state["metrics"], state["market_context"]
        )
        state["output"] = self.ai_engine.to_db_payload(output, state["trade"].id)
        return state

    async def run(self, trade: Any, trades: list[Any]) -> dict[str, Any]:
        state: ForensicsState = {
            "trade": trade,
            "trades": trades,
            "metrics": {},
            "market_context": {},
            "output": None,
        }
        state = await self.normalize(state)
        state = await self.score(state)
        state = await self.reason(state)
        return state["output"] or {}
