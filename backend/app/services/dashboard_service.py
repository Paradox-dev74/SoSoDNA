from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_insight import AIInsight
from app.models.behavioral_metric import BehavioralMetric
from app.models.market_regime import MarketRegime
from app.models.trade import Trade
from app.risk.engine import RiskEngine
from app.schemas.dashboard import DashboardSummary, MetricTile


class DashboardService:
    def __init__(self) -> None:
        self.risk_engine = RiskEngine()

    async def get_summary(self, db: AsyncSession, user_id: UUID) -> DashboardSummary:
        trades_result = await db.execute(
            select(Trade).where(Trade.user_id == user_id).order_by(Trade.executed_at.desc()).limit(100)
        )
        trades = trades_result.scalars().all()
        trade_count = len(trades)

        regime_result = await db.execute(
            select(MarketRegime)
            .where(MarketRegime.end_at.is_(None))
            .order_by(MarketRegime.start_at.desc())
            .limit(1)
        )
        regime = regime_result.scalar_one_or_none()
        current_regime = regime.regime_type if regime else "unknown"

        if trade_count == 0:
            return DashboardSummary(
                data_status="no_trades",
                trade_count=0,
                net_pnl_usd=0.0,
                behavioral_risk_score=0.0,
                liquidity_stress_index=0.0,
                execution_precision_score=0.0,
                current_regime=current_regime,
                metrics=[],
                recent_insight_titles=[],
                message=(
                    "No live SoDEX trades imported yet. Market regime and heatmaps use market-level data; "
                    "personal behavioral analysis requires at least one trade."
                ),
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

        net_pnl = sum(float(t.realized_pnl_usd or 0) for t in trades)
        behavioral_risk = round(
            metrics["revenge_trading_probability"] * 0.35
            + metrics["liquidity_stress_index"] * 0.35
            + metrics["volatility_fragility_index"] * 0.3,
            2,
        )

        insights_result = await db.execute(
            select(AIInsight).where(AIInsight.user_id == user_id).order_by(AIInsight.created_at.desc()).limit(5)
        )
        insights = insights_result.scalars().all()

        return DashboardSummary(
            data_status="live_analysis",
            trade_count=trade_count,
            net_pnl_usd=round(net_pnl, 2),
            behavioral_risk_score=behavioral_risk,
            liquidity_stress_index=metrics["liquidity_stress_index"],
            execution_precision_score=metrics["execution_precision_score"],
            current_regime=current_regime,
            metrics=[
                MetricTile(label="Liquidity Stress", value=f"{metrics['liquidity_stress_index']:.0%}"),
                MetricTile(label="Emotional Entry", value=f"{metrics['emotional_entry_score']:.0%}"),
                MetricTile(label="Sweep Exposure", value=f"{metrics['sweep_exposure_rating']:.0%}"),
                MetricTile(label="Execution Precision", value=f"{metrics['execution_precision_score']:.0%}"),
                MetricTile(label="Revenge Probability", value=f"{metrics['revenge_trading_probability']:.0%}"),
            ],
            recent_insight_titles=[i.title for i in insights],
            message=f"Analysis based on {trade_count} imported SoDEX trade(s).",
        )
