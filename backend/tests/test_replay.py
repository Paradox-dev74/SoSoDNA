from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.replay.engine import MissingSnapshotError, ReplayEngine


class _Trade:
    def __init__(self):
        self.id = "00000000-0000-0000-0000-000000000001"
        self.symbol = "BTC-USD"
        self.side = "long"
        self.price = Decimal("65000")
        self.executed_at = datetime.now(timezone.utc)
        self.raw_payload = {"spread_bps": 9.5}


@pytest.mark.asyncio
async def test_missing_snapshots_raises():
    engine = ReplayEngine()
    db = AsyncMock()
    empty_result = MagicMock()
    empty_result.scalars.return_value.all.return_value = []
    empty_result.scalar_one_or_none.return_value = None
    db.execute.return_value = empty_result

    with pytest.raises(MissingSnapshotError):
        await engine.build_frames_from_data(db, _Trade())


def test_missing_snapshot_error_message():
    err = MissingSnapshotError("BTC-USD", "trade-123")
    assert "BTC-USD" in str(err)
    assert "trade-123" in str(err)
