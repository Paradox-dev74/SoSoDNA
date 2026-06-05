from typing import Any
from uuid import UUID

from app.ai.schemas import EvidenceItem, ForensicInsightOutput
from app.core.config import get_settings
from app.models.sosovalue_event import event_display_title

settings = get_settings()


class InsufficientEvidenceError(Exception):
    """Raised when live trade, metric, or market evidence is missing."""


class AIInsightEngine:
    """Evidence-only AI insight generation — no synthetic defaults."""

    def has_valid_evidence(self, output: ForensicInsightOutput) -> bool:
        return len(output.evidence) >= 2 and output.confidence > 0

    def assess_evidence(
        self,
        trade: Any | None,
        metrics: dict[str, float],
        market_context: dict[str, Any] | None = None,
        macro_event: Any | None = None,
    ) -> list[str]:
        blockers: list[str] = []
        if not trade:
            blockers.append("No imported SoDEX trade available for analysis.")
        if not metrics or not any(v > 0 for v in metrics.values()):
            blockers.append("Behavioral metrics require at least one imported trade.")
        market_context = market_context or {}
        spread_bps = market_context.get("spread_bps")
        if spread_bps is None:
            blockers.append("No live orderbook snapshot spread available for entry context.")
        if macro_event is None and not market_context.get("sosovalue_event_title"):
            blockers.append("No SoSoValue macro or news evidence synced.")
        return blockers

    async def generate_trade_forensics(
        self,
        trade: Any,
        metrics: dict[str, float],
        market_context: dict[str, Any] | None = None,
        macro_event: Any | None = None,
    ) -> ForensicInsightOutput:
        blockers = self.assess_evidence(trade, metrics, market_context, macro_event)
        if blockers:
            raise InsufficientEvidenceError("; ".join(blockers))

        market_context = market_context or {}
        spread_bps = float(market_context["spread_bps"])
        spread_percentile = market_context.get("spread_percentile")
        similar_losing = int(market_context.get("similar_losing_trades", 0))
        win_rate = market_context.get("win_rate_similar_setups")
        volatility_5m = market_context.get("volatility_5m")
        regime = str(market_context.get("regime", "unknown"))

        evidence: list[EvidenceItem] = [
            EvidenceItem(
                metric="spread_at_entry_bps",
                value=spread_bps,
                context="From live SoDEX orderbook snapshot near trade execution",
            ),
            EvidenceItem(
                metric="liquidity_stress_index",
                value=metrics["liquidity_stress_index"],
                context="Derived from imported trade history",
            ),
            EvidenceItem(
                metric="revenge_trading_probability",
                value=metrics["revenge_trading_probability"],
                context="Behavioral pattern from imported trades",
            ),
        ]
        if spread_percentile is not None:
            evidence.append(
                EvidenceItem(
                    metric="spread_percentile",
                    value=float(spread_percentile),
                    context="Relative to your historical spread distribution",
                )
            )
        if macro_event:
            evidence.append(
                EvidenceItem(
                    metric="sosovalue_macro_event",
                    value=event_display_title(macro_event),
                    context="Recent SoSoValue macro event",
                )
            )

        confidence = min(
            0.92,
            0.45
            + (0.15 if spread_bps > 0 else 0)
            + (0.15 if macro_event else 0)
            + (0.1 if similar_losing > 0 else 0)
            + (0.07 if metrics.get("revenge_trading_probability", 0) > 0.3 else 0),
        )

        pnl = float(trade.realized_pnl_usd or 0)
        output = ForensicInsightOutput(
            title="Entry occurred during observable liquidity stress",
            claim=(
                f"Your {trade.side} on {trade.symbol} shows execution fragility under live microstructure. "
                f"Spread was {spread_bps:.1f} bps at entry"
                + (f", above your {float(spread_percentile):.0f}th percentile." if spread_percentile is not None else ".")
            ),
            evidence=evidence,
            market_context={
                "regime": regime,
                "spread_bps": spread_bps,
                "volatility_5m": float(volatility_5m) if volatility_5m is not None else 0.0,
                "data_source": "live_sodex_snapshot",
            },
            historical_pattern={
                "similar_trades": similar_losing,
                "win_rate": float(win_rate) if win_rate is not None else 0.0,
                "avg_loss_usd": pnl if pnl < 0 else 0.0,
            },
            confidence=round(confidence, 2),
            severity="warning" if spread_bps > 10 or pnl < 0 else "watch",
            recommended_action=(
                "Wait for spread normalization below 8 bps before re-entering similar setups."
                if spread_bps > 8
                else "Monitor spread and depth before scaling size."
            ),
        )

        if settings.openai_api_key:
            output = await self._enhance_with_llm(output, trade, metrics)

        if not self.has_valid_evidence(output):
            raise InsufficientEvidenceError("Generated insight did not meet minimum evidence threshold.")

        return output

    async def _enhance_with_llm(
        self,
        base: ForensicInsightOutput,
        trade: Any,
        metrics: dict[str, float],
    ) -> ForensicInsightOutput:
        try:
            from langchain_openai import ChatOpenAI
            from langchain_core.messages import HumanMessage, SystemMessage

            llm = ChatOpenAI(model="gpt-4o-mini", api_key=settings.openai_api_key, temperature=0.2)
            system = (
                "You are an institutional behavioral market forensics engine. "
                "Rewrite the claim to be sharper and evidence-bound. Return only the refined claim text."
            )
            human = (
                f"Trade: {trade.symbol} {trade.side} PNL {trade.realized_pnl_usd}. "
                f"Metrics: {metrics}. Base claim: {base.claim}"
            )
            response = await llm.ainvoke([SystemMessage(content=system), HumanMessage(content=human)])
            if response.content:
                base.claim = str(response.content).strip()
        except Exception:
            pass
        return base

    def to_db_payload(self, output: ForensicInsightOutput, trade_id: UUID | None = None) -> dict[str, Any]:
        return {
            "insight_type": "forensic",
            "severity": output.severity,
            "title": output.title,
            "summary": output.claim,
            "evidence": {
                "items": [e.model_dump() for e in output.evidence],
                "market_context": output.market_context,
                "historical_pattern": output.historical_pattern,
            },
            "recommendations": {"action": output.recommended_action},
            "confidence": output.confidence,
            "trade_id": trade_id,
        }
