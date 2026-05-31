from datetime import datetime, timedelta, timezone

from app.risk.engine import RiskEngine
from app.schemas.risk import PreTradeRiskRequest


class _Trade:
    def __init__(self, pnl: float, spread: float = 8.0, minutes_ago: int = 0):
        self.realized_pnl_usd = pnl
        self.executed_at = datetime.now(timezone.utc) - timedelta(minutes=minutes_ago)
        self.raw_payload = {"spread_bps": spread}


def test_empty_metrics_when_no_trades():
    engine = RiskEngine()
    metrics = engine.compute_metrics_from_trades([])
    assert metrics["liquidity_stress_index"] == 0.0
    assert metrics["revenge_trading_probability"] == 0.0


def test_pretrade_evaluation_with_market_context():
    engine = RiskEngine()
    trades = [_Trade(-100, 14, 5), _Trade(-50, 12, 15), _Trade(80, 7, 30)]
    metrics = engine.compute_metrics_from_trades(trades)
    request = PreTradeRiskRequest(symbol="BTC-USD", side="long", size_usd=5000)
    result = engine.evaluate_pretrade(
        request,
        metrics,
        trades,
        market_context={"spread_bps": 14.0, "macro_events_nearby": True},
    )
    assert result.similarity_to_losing_setups > 0
    assert len(result.contributors) >= 1
