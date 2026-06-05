import time
import uuid
from decimal import Decimal, ROUND_DOWN
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations.sodex.client import SodexClient
from app.integrations.sodex.errors import SodexApiError
from app.models.trade import Order
from app.models.sodex_account import SodexAccount
from app.models.wallet import Wallet
from app.risk.engine import RiskEngine
from app.schemas.execution import OrderPreviewRequest, OrderPreviewResponse
from app.schemas.risk import PreTradeRiskRequest
from app.services.sync_service import SyncService

SODEX_FUTURES_CHAIN_ID = 286623
ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
RISK_BLOCK_THRESHOLD = 0.75


class ExecutionService:
    def __init__(self) -> None:
        self.client = SodexClient()
        self.risk_engine = RiskEngine()
        self.sync_service = SyncService()

    async def list_markets(self, symbol: str | None = None, market_type: str = "perps") -> list[dict[str, Any]]:
        symbols = await self.client.get_symbols(market_type=market_type, raise_on_error=True)
        if symbol:
            normalized = self.client.normalize_symbol(symbol)
            symbols = [s for s in symbols if str(s.get("name") or s.get("symbol")) == normalized]
        markets: list[dict[str, Any]] = []
        for item in symbols:
            name = str(item.get("name") or item.get("symbol") or "")
            if not name:
                continue
            mark_price = None
            try:
                tickers = await self.client.get_mark_prices(name, market_type=market_type)
                if tickers:
                    mark_price = str(tickers[0].get("markPrice") or tickers[0].get("price") or "")
            except SodexApiError:
                mark_price = None
            markets.append(
                {
                    "symbol": name,
                    "symbol_id": int(item.get("id") or item.get("symbolID") or 0),
                    "price_precision": int(item.get("pricePrecision") or 0),
                    "quantity_precision": int(item.get("quantityPrecision") or 5),
                    "step_size": str(item.get("stepSize") or "0.00001"),
                    "min_notional": str(item.get("minNotional") or "10"),
                    "mark_price": mark_price,
                    "status": item.get("status"),
                }
            )
        return markets

    async def _resolve_account(self, db: AsyncSession, user_id: UUID) -> tuple[int, str]:
        wallet_result = await db.execute(select(Wallet).where(Wallet.user_id == user_id).limit(1))
        wallet = wallet_result.scalar_one_or_none()
        if not wallet:
            raise SodexApiError("No wallet linked. Connect wallet and sync SoDEX data first.")

        sodex_result = await db.execute(
            select(SodexAccount).where(SodexAccount.wallet_id == wallet.id).limit(1)
        )
        sodex_account = sodex_result.scalar_one_or_none()
        account_id = sodex_account.account_id if sodex_account else None

        if not account_id:
            state = await self.client.get_account_state(wallet.address, market_type="perps", raise_on_error=True)
            if not state:
                raise SodexApiError("SoDEX account not found for this wallet. Deposit on testnet and sync first.")
            account_id = state.get("aid") or state.get("accountID")
            if not account_id:
                raise SodexApiError("SoDEX account ID missing from account state.")

        return int(account_id), wallet.address.lower()

    async def build_preview(
        self,
        db: AsyncSession,
        user_id: UUID,
        request: OrderPreviewRequest,
        *,
        risk_context: dict[str, Any] | None = None,
        risk_trades: list[Any] | None = None,
        risk_response: Any | None = None,
    ) -> OrderPreviewResponse:
        account_id, _ = await self._resolve_account(db, user_id)
        markets = await self.list_markets(request.symbol, market_type=request.market_type)
        if not markets:
            raise SodexApiError(f"Symbol {request.symbol} not found on SoDEX testnet.")

        market = markets[0]
        symbol_id = int(market["symbol_id"])
        if symbol_id <= 0:
            raise SodexApiError("Invalid symbol metadata from SoDEX.")

        mark_price = Decimal(market.get("mark_price") or "0")
        if mark_price <= 0:
            orderbook = await self.client.get_orderbook(request.symbol, market_type=request.market_type, raise_on_error=True)
            if not orderbook:
                raise SodexApiError("Live orderbook required to size market order.")
            bids = orderbook.get("bids") or []
            asks = orderbook.get("asks") or []
            if not bids or not asks:
                raise SodexApiError("Orderbook missing bid/ask for sizing.")
            best_bid = Decimal(str(bids[0][0]))
            best_ask = Decimal(str(asks[0][0]))
            mark_price = (best_bid + best_ask) / 2

        step = Decimal(market["step_size"])
        qty = (Decimal(str(request.size_usd)) / mark_price).quantize(step, rounding=ROUND_DOWN)
        if qty <= 0:
            raise SodexApiError("Order size too small for current mark price.")

        is_long = request.side.lower() in ("long", "buy")
        side_enum = 1 if is_long else 2
        position_side = 1 if is_long else 2
        cl_ord_id = f"soso-{uuid.uuid4().hex[:12]}"

        order_item: dict[str, Any] = {
            "clOrdID": cl_ord_id,
            "modifier": 1,
            "side": side_enum,
            "type": 2,
            "timeInForce": 3,
            "reduceOnly": False,
            "positionSide": position_side,
        }

        if is_long and request.order_type == "market":
            order_item["funds"] = str(Decimal(str(request.size_usd)).quantize(Decimal("0.01"), rounding=ROUND_DOWN))
        else:
            order_item["quantity"] = format(qty, f".{market['quantity_precision']}f")

        body = {
            "accountID": account_id,
            "symbolID": symbol_id,
            "orders": [order_item],
        }

        risk_allowed = True
        risk_blocked_reason = None
        risk_payload = None
        if risk_response is not None:
            risk_payload = risk_response.model_dump() if hasattr(risk_response, "model_dump") else risk_response
            similarity = float(risk_payload.get("similarity_to_losing_setups", 0))
            if similarity >= RISK_BLOCK_THRESHOLD:
                risk_allowed = False
                risk_blocked_reason = (
                    f"Risk similarity {similarity:.0%} exceeds block threshold ({RISK_BLOCK_THRESHOLD:.0%})."
                )

        payload_hash = self._payload_hash(body)
        nonce = int(time.time() * 1000)

        return OrderPreviewResponse(
            account_id=account_id,
            symbol=request.symbol,
            symbol_id=symbol_id,
            side=request.side,
            size_usd=request.size_usd,
            order_type=request.order_type,
            cl_ord_id=cl_ord_id,
            request_body=body,
            risk_allowed=risk_allowed,
            risk_blocked_reason=risk_blocked_reason,
            risk=risk_payload,
            signing_nonce=nonce,
            signing_domain={
                "name": "futures",
                "chainId": SODEX_FUTURES_CHAIN_ID,
                "verifyingContract": ZERO_ADDRESS,
            },
            signing_types={
                "ExchangeAction": [
                    {"name": "payloadHash", "type": "bytes32"},
                    {"name": "nonce", "type": "uint64"},
                ],
            },
            signing_message={
                "payloadHash": payload_hash,
                "nonce": nonce,
            },
        )

    async def submit_signed_order(
        self,
        db: AsyncSession,
        user_id: UUID,
        *,
        request_body: dict[str, Any],
        api_key_name: str,
        api_sign: str,
        api_nonce: str,
        market_type: str = "perps",
    ) -> dict[str, Any]:
        result = await self.client.submit_signed_order(
            request_body,
            api_key_name=api_key_name,
            api_sign=api_sign,
            api_nonce=api_nonce,
            market_type=market_type,
        )

        cl_ord_id = None
        order_id = None
        success = False
        error = None

        data = result.get("data")
        if isinstance(data, list) and data:
            first = data[0]
            cl_ord_id = first.get("clOrdID")
            if int(first.get("code", -1)) == 0:
                success = True
                order_id = str(first.get("orderID") or "")
            else:
                error = first.get("error") or "SoDEX rejected order"
        elif isinstance(result, dict) and result.get("code") not in (None, 0):
            error = result.get("error") or result.get("message") or "SoDEX rejected order"
        else:
            success = True

        if success:
            await self._record_order(db, user_id, request_body, result, cl_ord_id, order_id)
            sync_summary = await self.sync_service.sync_user_data(db, user_id)
            await db.commit()
            return {
                "success": True,
                "cl_ord_id": cl_ord_id,
                "order_id": order_id,
                "sodex_response": result,
                "sync_summary": sync_summary,
            }

        await db.commit()
        return {
            "success": False,
            "cl_ord_id": cl_ord_id,
            "order_id": order_id,
            "sodex_response": result,
            "error": error or "Order submission failed",
        }

    async def _record_order(
        self,
        db: AsyncSession,
        user_id: UUID,
        request_body: dict[str, Any],
        sodex_response: dict[str, Any],
        cl_ord_id: str | None,
        order_id: str | None,
    ) -> None:
        orders = request_body.get("orders") or []
        first = orders[0] if orders else {}
        db.add(
            Order(
                user_id=user_id,
                sodex_order_id=order_id or cl_ord_id or f"pending-{uuid.uuid4().hex[:8]}",
                client_order_id=cl_ord_id or first.get("clOrdID"),
                status="submitted",
                side="long" if int(first.get("side", 1)) == 1 else "short",
                type="market" if int(first.get("type", 2)) == 2 else "limit",
                time_in_force="IOC",
                price=Decimal(str(first.get("price"))) if first.get("price") else None,
                quantity=Decimal(str(first.get("quantity") or first.get("funds") or "0")),
                filled_quantity=Decimal("0"),
                raw_payload={"request": request_body, "response": sodex_response},
            )
        )

    def _payload_hash(self, body: dict[str, Any]) -> str:
        return SodexClient.compute_payload_hash(body)
