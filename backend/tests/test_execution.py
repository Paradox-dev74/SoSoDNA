import json

from eth_utils import keccak

from app.integrations.sodex.client import SodexClient
from app.integrations.sodex.errors import SodexApiError
from app.risk.engine import RiskEngine
from app.schemas.risk import PreTradeRiskRequest


def test_payload_hash_keccak():
    body = {
        "accountID": 1001,
        "symbolID": 1,
        "orders": [{"clOrdID": "test-1", "side": 1, "type": 2, "timeInForce": 3, "funds": "50"}],
    }
    canonical = json.dumps(body, separators=(",", ":"), ensure_ascii=False)
    expected = "0x" + keccak(text=canonical).hex()
    assert SodexClient.compute_payload_hash(body) == expected


def test_risk_requires_live_spread():
    engine = RiskEngine()
    request = PreTradeRiskRequest(symbol="BTC-USD", side="long", size_usd=100)
    try:
        engine.evaluate_pretrade(request, engine.compute_metrics_from_trades([]), [], market_context={})
        raised = False
    except ValueError:
        raised = True
    assert raised


def test_sodex_api_error_fields():
    err = SodexApiError("timeout", status_code=504, url="https://example.com", code=1)
    assert err.message == "timeout"
    assert err.status_code == 504
    assert err.code == 1
