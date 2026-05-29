from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class TradeResponse(BaseModel):
    id: UUID
    external_trade_id: str
    symbol: str
    market_type: str
    side: str
    order_type: str
    quantity: Decimal
    price: Decimal
    notional_usd: Decimal
    fee_usd: Decimal
    realized_pnl_usd: Decimal | None
    executed_at: datetime

    model_config = {"from_attributes": True}


class TradeForensicsResponse(BaseModel):
    trade: TradeResponse
    liquidity_stress_index: float
    emotional_entry_score: float
    sweep_exposure_rating: float
    execution_precision_score: float
    revenge_trading_probability: float
    volatility_fragility_index: float
    spread_at_entry_bps: float
    spread_percentile: float
    regime: str
    similar_losing_trades: int
    win_rate_similar_setups: float
