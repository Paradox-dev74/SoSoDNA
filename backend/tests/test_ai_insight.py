import pytest

from app.ai.insight_engine import AIInsightEngine, InsufficientEvidenceError
from app.ai.schemas import EvidenceItem, ForensicInsightOutput


class _Trade:
    symbol = "BTC-USD"
    side = "long"
    realized_pnl_usd = -100
    raw_payload = {"spread_bps": 12.0}


class _Macro:
    title = "Fed decision"
    source_id = "macro-1"
    importance_score = 0.8


def test_has_valid_evidence_requires_items():
    engine = AIInsightEngine()
    valid = ForensicInsightOutput(
        title="Test",
        claim="Claim",
        evidence=[EvidenceItem(metric="a", value=1, context="x"), EvidenceItem(metric="b", value=2, context="y")],
        market_context={},
        historical_pattern={},
        confidence=0.8,
        severity="info",
        recommended_action="wait",
    )
    invalid = ForensicInsightOutput(
        title="Test",
        claim="Claim",
        evidence=[],
        market_context={},
        historical_pattern={},
        confidence=0.8,
        severity="info",
        recommended_action="wait",
    )
    assert engine.has_valid_evidence(valid) is True
    assert engine.has_valid_evidence(invalid) is False


def test_assess_evidence_blocks_without_trade():
    engine = AIInsightEngine()
    blockers = engine.assess_evidence(None, {}, {}, None)
    assert any("trade" in b.lower() for b in blockers)


def test_assess_evidence_blocks_without_spread():
    engine = AIInsightEngine()
    metrics = {"liquidity_stress_index": 0.5, "revenge_trading_probability": 0.4}
    blockers = engine.assess_evidence(_Trade(), metrics, {"spread_bps": None}, _Macro())
    assert any("spread" in b.lower() for b in blockers)


@pytest.mark.asyncio
async def test_generate_raises_without_evidence():
    engine = AIInsightEngine()
    with pytest.raises(InsufficientEvidenceError):
        await engine.generate_trade_forensics(_Trade(), {}, {"spread_bps": None}, None)


@pytest.mark.asyncio
async def test_generate_with_live_evidence():
    engine = AIInsightEngine()
    metrics = {
        "liquidity_stress_index": 0.6,
        "revenge_trading_probability": 0.5,
        "emotional_entry_score": 0.4,
        "sweep_exposure_rating": 0.3,
        "execution_precision_score": 0.7,
        "volatility_fragility_index": 0.5,
    }
    output = await engine.generate_trade_forensics(
        _Trade(),
        metrics,
        {"spread_bps": 11.2, "regime": "spread_expansion", "similar_losing_trades": 2},
        _Macro(),
    )
    assert engine.has_valid_evidence(output)
    assert output.evidence[0].metric == "spread_at_entry_bps"
