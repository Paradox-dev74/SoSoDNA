from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.behavioral_metric import BehavioralMetric
from app.models.trade import Trade
from app.risk.engine import RiskEngine
from app.schemas.dna import DnaMetric, TraderDnaProfile


class DnaService:
    def __init__(self) -> None:
        self.risk_engine = RiskEngine()

    async def get_profile(self, db: AsyncSession, user_id: UUID) -> TraderDnaProfile:
        trades_result = await db.execute(
            select(Trade).where(Trade.user_id == user_id).order_by(Trade.executed_at.desc())
        )
        trades = trades_result.scalars().all()
        trade_count = len(trades)

        if trade_count == 0:
            return TraderDnaProfile(
                data_status="no_trades",
                trade_count=0,
                archetype="Awaiting Trade Data",
                risk_personality="Import SoDEX trades to generate your behavioral fingerprint",
                strengths=["Connect wallet and sync SoDEX testnet data"],
                weaknesses=["No trade history available yet"],
                hidden_pnl_leaks=["Place testnet trades and re-sync to surface hidden PNL leaks"],
                metrics=[],
                behavioral_fingerprint=self.risk_engine._empty_metrics(),
                message="Personal DNA profiling requires at least one imported SoDEX trade.",
            )

        metrics_result = await db.execute(
            select(BehavioralMetric)
            .where(BehavioralMetric.user_id == user_id, BehavioralMetric.trade_id.is_(None))
            .order_by(BehavioralMetric.created_at.desc())
            .limit(1)
        )
        metric_row = metrics_result.scalar_one_or_none()
        metrics = (
            {
                "liquidity_stress_index": float(metric_row.liquidity_stress_index),
                "emotional_entry_score": float(metric_row.emotional_entry_score),
                "sweep_exposure_rating": float(metric_row.sweep_exposure_rating),
                "execution_precision_score": float(metric_row.execution_precision_score),
                "revenge_trading_probability": float(metric_row.revenge_trading_probability),
                "volatility_fragility_index": float(metric_row.volatility_fragility_index),
            }
            if metric_row
            else self.risk_engine.compute_metrics_from_trades(trades)
        )

        archetype, risk_personality = self.risk_engine.derive_archetype(metrics)
        strengths, weaknesses, leaks = self._derive_from_trades(trades)

        return TraderDnaProfile(
            data_status="live_analysis",
            trade_count=trade_count,
            archetype=archetype,
            risk_personality=risk_personality,
            strengths=strengths,
            weaknesses=weaknesses,
            hidden_pnl_leaks=leaks,
            metrics=[
                DnaMetric(key="liquidity_stress_index", label="Liquidity Stress Index", value=metrics["liquidity_stress_index"], description="Hostility of current liquidity for your execution style"),
                DnaMetric(key="emotional_entry_score", label="Emotional Entry Score", value=metrics["emotional_entry_score"], description="Impulsive entry pattern similarity"),
                DnaMetric(key="sweep_exposure_rating", label="Sweep Exposure Rating", value=metrics["sweep_exposure_rating"], description="Vulnerability to liquidity sweeps"),
                DnaMetric(key="execution_precision_score", label="Execution Precision Score", value=metrics["execution_precision_score"], description="Quality of execution relative to available liquidity"),
                DnaMetric(key="revenge_trading_probability", label="Revenge Trading Probability", value=metrics["revenge_trading_probability"], description="Likelihood of post-loss overtrading"),
                DnaMetric(key="volatility_fragility_index", label="Volatility Fragility Index", value=metrics["volatility_fragility_index"], description="Performance degradation during volatility expansion"),
            ],
            behavioral_fingerprint=metrics,
            message=f"Profile derived from {trade_count} imported SoDEX trade(s).",
        )

    def _derive_from_trades(self, trades: list[Trade]) -> tuple[list[str], list[str], list[str]]:
        if not trades:
            return (
                ["Connect wallet and sync SoDEX to begin profiling"],
                ["No trade history available yet"],
                ["Import trades to detect hidden PNL leaks"],
            )

        losing = [t for t in trades if t.realized_pnl_usd is not None and float(t.realized_pnl_usd) < 0]
        winning = [t for t in trades if t.realized_pnl_usd is not None and float(t.realized_pnl_usd) > 0]
        loss_rate = len(losing) / len(trades)

        spread_losses = [
            t for t in losing
            if t.raw_payload and t.raw_payload.get("spread_bps") is not None and float(t.raw_payload["spread_bps"]) > 10
        ]

        strengths = []
        weaknesses = []
        leaks = []

        if winning:
            strengths.append(f"Profitable in {len(winning)} of {len(trades)} analyzed trades")
        if any(t.raw_payload and t.raw_payload.get("spread_bps") is not None and float(t.raw_payload["spread_bps"]) < 6 for t in winning):
            strengths.append("Best execution quality when spread is below 6 bps")

        if loss_rate > 0.5:
            weaknesses.append(f"Loss rate at {loss_rate:.0%} across imported trade history")
        if spread_losses:
            weaknesses.append(f"{len(spread_losses)} losses occurred during elevated spread conditions")
            leaks.append(f"{len(spread_losses) / max(len(losing), 1):.0%} of losses linked to spread expansion entries")

        if not strengths:
            strengths.append("Insufficient winning pattern data — continue trading to refine profile")
        if not weaknesses:
            weaknesses.append("No dominant weakness cluster detected yet")
        if not leaks:
            leaks.append("Run more trades on SoDEX testnet to surface hidden PNL leaks")

        return strengths, weaknesses, leaks
