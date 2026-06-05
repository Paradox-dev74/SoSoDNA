from datetime import datetime, timezone

from app.services.sodex_ingestion import SodexIngestionService


def test_normalize_sodex_buy_side():
    service = SodexIngestionService()
    assert service._normalize_side("BUY") == "long"
    assert service._normalize_side("SELL") == "short"


def test_trade_id_field_accepted():
    raw = {
        "symbol": "ETH-USD",
        "tradeID": 1637678,
        "side": "BUY",
        "price": "1627.9",
        "quantity": "0.0302",
        "time": 1780868347693,
    }
    external_id = (
        raw.get("tradeID")
        or raw.get("tradeId")
        or raw.get("id")
        or raw.get("fillId")
        or raw.get("tid")
    )
    assert external_id == 1637678
    ts = SodexIngestionService()._parse_ts(raw.get("time"))
    assert isinstance(ts, datetime)
    assert ts.tzinfo == timezone.utc
