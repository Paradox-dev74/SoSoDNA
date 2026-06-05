from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from app.schemas.risk import PreTradeRiskRequest, PreTradeRiskResponse, RiskContributor


class RiskEngine:
    """Deterministic behavioral risk scoring engine."""

    def compute_metrics_from_trades(self, trades: list[Any]) -> dict[str, float]:
        if not trades:
            return self._empty_metrics()

        losing = [t for t in trades if t.realized_pnl_usd is not None and float(t.realized_pnl_usd) < 0]
        total = len(trades)
        loss_rate = len(losing) / total if total else 0.0

        spread_values = [
            float(t.raw_payload["spread_bps"])
            for t in trades
            if t.raw_payload and t.raw_payload.get("spread_bps") is not None
        ]
        avg_spread = sum(spread_values) / len(spread_values) if spread_values else 0.0

        revenge_prob = min(0.95, loss_rate * 1.2 + 0.15)
        liquidity_stress = min(0.99, avg_spread / 20.0)
        emotional_entry = min(0.99, revenge_prob * 0.85)
        sweep_exposure = min(0.99, liquidity_stress * 0.9 + 0.1)
        execution_precision = max(0.1, 1.0 - emotional_entry * 0.6)
        volatility_fragility = min(0.99, loss_rate * 0.8 + 0.2)

        return {
            "liquidity_stress_index": round(liquidity_stress, 4),
            "emotional_entry_score": round(emotional_entry, 4),
            "sweep_exposure_rating": round(sweep_exposure, 4),
            "execution_precision_score": round(execution_precision, 4),
            "revenge_trading_probability": round(revenge_prob, 4),
            "volatility_fragility_index": round(volatility_fragility, 4),
            "overtrading_pressure": round(loss_rate * 0.7, 4),
            "loss_chase_intensity": round(revenge_prob * 0.6, 4),
        }

    def _empty_metrics(self) -> dict[str, float]:
        return {
            "liquidity_stress_index": 0.0,
            "emotional_entry_score": 0.0,
            "sweep_exposure_rating": 0.0,
            "execution_precision_score": 0.0,
            "revenge_trading_probability": 0.0,
            "volatility_fragility_index": 0.0,
            "overtrading_pressure": 0.0,
            "loss_chase_intensity": 0.0,
        }

    def evaluate_pretrade(
        self,
        request: PreTradeRiskRequest,
        user_metrics: dict[str, float],
        recent_trades: list[Any],
        market_context: dict[str, Any] | None = None,
        liquidity_snapshot: Any | None = None,
    ) -> PreTradeRiskResponse:
        market_context = market_context or {}
        if liquidity_snapshot:
            spread_bps = float(liquidity_snapshot.spread_bps)
        elif market_context.get("spread_bps") is not None:
            spread_bps = float(market_context["spread_bps"])
        else:
            raise ValueError("Live orderbook spread evidence required for pre-trade risk evaluation.")
        volatility_5m = market_context.get("volatility_5m")
        volatility_5m = float(volatility_5m) if volatility_5m is not None else None
        time_since_loss_min = self._minutes_since_last_loss(recent_trades)
        macro_risk = 0.1 if market_context.get("macro_events_nearby") else 0.0

        similarity = min(
            0.99,
            user_metrics.get("revenge_trading_probability", 0.0) * 0.35
            + user_metrics.get("liquidity_stress_index", 0.0) * 0.25
            + (spread_bps / 20.0) * 0.2
            + (0.15 if time_since_loss_min < 10 else 0.0)
            + macro_risk,
        )

        contributors: list[RiskContributor] = []
        if spread_bps > 8:
            contributors.append(
                RiskContributor(
                    factor="Spread Expansion",
                    impact=min(0.4, spread_bps / 30),
                    description=f"Current spread at {spread_bps:.1f} bps based on latest orderbook snapshot.",
                )
            )
        if time_since_loss_min < 10:
            contributors.append(
                RiskContributor(
                    factor="Revenge Trade Window",
                    impact=0.24,
                    description=f"Entry within {time_since_loss_min:.0f} minutes of prior loss.",
                )
            )
        if liquidity_snapshot and float(liquidity_snapshot.ask_depth_1pct) < float(liquidity_snapshot.bid_depth_1pct) * 0.7:
            contributors.append(
                RiskContributor(
                    factor="Thin Ask Depth",
                    impact=0.18,
                    description="Ask depth materially thinner than bid depth in latest snapshot.",
                )
            )
        if market_context.get("macro_events_nearby"):
            contributors.append(
                RiskContributor(
                    factor="Macro Event Proximity",
                    impact=0.12,
                    description="Recent SoSoValue macro event may elevate volatility risk.",
                )
            )

        if not contributors:
            contributors.append(
                RiskContributor(
                    factor="Historical Pattern",
                    impact=similarity * 0.5,
                    description="Setup similarity derived from your historical trade behavior.",
                )
            )

        losing_similar = [t for t in recent_trades if t.realized_pnl_usd is not None and float(t.realized_pnl_usd) < 0]
        win_rate = 1 - (len(losing_similar) / len(recent_trades)) if recent_trades else 0.0
        severity = "critical" if similarity >= 0.75 else "warning" if similarity >= 0.55 else "watch"

        return PreTradeRiskResponse(
            similarity_to_losing_setups=round(similarity, 4),
            severity=severity,
            title=f"This setup matches {int(similarity * 100)}% of your historical losing entries",
            summary=(
                f"Proposed {request.side} on {request.symbol} at ${request.size_usd:,.0f} notional "
                f"resembles conditions where your historical win rate was {win_rate:.0%}."
            ),
            contributors=contributors,
            recommended_action="Delay entry until spread normalizes or reduce size by 40%." if similarity >= 0.55 else "Proceed with normal risk controls.",
            confidence=round(min(0.95, 0.6 + len(contributors) * 0.08), 2),
        )

    def _minutes_since_last_loss(self, trades: list[Any]) -> float:
        losing = [
            t for t in trades
            if t.realized_pnl_usd is not None and float(t.realized_pnl_usd) < 0
        ]
        if not losing:
            return 999.0
        latest_loss = max(t.executed_at for t in losing)
        if latest_loss.tzinfo is None:
            latest_loss = latest_loss.replace(tzinfo=timezone.utc)
        delta = datetime.now(timezone.utc) - latest_loss
        return delta.total_seconds() / 60

    def derive_archetype(self, metrics: dict[str, float]) -> tuple[str, str]:
        if not any(metrics.values()):
            return "Insufficient Data", "Import SoDEX trades to generate profile"
        revenge = metrics.get("revenge_trading_probability", 0)
        liquidity = metrics.get("liquidity_stress_index", 0)
        precision = metrics.get("execution_precision_score", 0)

        if revenge > 0.7:
            return "Post-Loss Accelerator", "Impulse-driven under stress"
        if liquidity > 0.75:
            return "Liquidity Chaser", "Execution-fragile in thin books"
        if precision > 0.8:
            return "Patient Breakout Executor", "Disciplined timing under stable regimes"
        if metrics.get("volatility_fragility_index", 0) > 0.7:
            return "Volatility Sprinter", "Directionally early, structurally fragile"
        return "Spread-Blind Scalper", "Fast entries without microstructure awareness"
