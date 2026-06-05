from typing import Any

from pydantic import BaseModel, Field


class ExecutionMarketResponse(BaseModel):
    symbol: str
    symbol_id: int
    price_precision: int
    quantity_precision: int
    step_size: str
    min_notional: str
    mark_price: str | None = None
    status: str | None = None


class OrderPreviewRequest(BaseModel):
    symbol: str = "BTC-USD"
    side: str = "long"
    size_usd: float = Field(gt=0)
    order_type: str = "market"
    market_type: str = "perps"


class OrderPreviewResponse(BaseModel):
    account_id: int
    symbol: str
    symbol_id: int
    side: str
    size_usd: float
    order_type: str
    cl_ord_id: str
    request_body: dict[str, Any]
    risk_allowed: bool
    risk_blocked_reason: str | None = None
    risk: dict[str, Any] | None = None
    signing_nonce: int
    signing_domain: dict[str, Any]
    signing_types: dict[str, Any]
    signing_message: dict[str, Any]


class SignedOrderSubmitRequest(BaseModel):
    request_body: dict[str, Any]
    api_key_name: str = Field(min_length=1, max_length=64)
    api_sign: str = Field(min_length=10)
    api_nonce: str = Field(min_length=1)
    market_type: str = "perps"


class OrderSubmitResponse(BaseModel):
    success: bool
    cl_ord_id: str | None = None
    order_id: str | None = None
    sodex_response: dict[str, Any] | None = None
    error: str | None = None
    sync_summary: dict[str, Any] | None = None
