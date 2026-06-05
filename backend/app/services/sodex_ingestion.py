import asyncio
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations.sodex.client import SodexClient
from app.integrations.sodex.errors import SodexApiError
from app.models.liquidity_snapshot import LiquiditySnapshot
from app.models.sodex_account import SodexAccount
from app.models.trade import Trade


class SodexIngestionService:
    DEFAULT_SYMBOL = "BTC-USD"

    def __init__(self) -> None:
        self.client = SodexClient()

    async def ingest_account_data(
        self,
        db: AsyncSession,
        user_id: UUID,
        wallet_address: str,
        sodex_account: SodexAccount | None = None,
        wallet_id: UUID | None = None,
    ) -> dict[str, Any]:
        address = wallet_address.lower()
        if not address.startswith("0x") or len(address) != 42:
            return {
                "account_id": None,
                "trades_imported": 0,
                "snapshots_imported": 0,
                "account_state_found": False,
                "error": "invalid_wallet_address",
                "message": "Expected a 0x-prefixed 40-byte wallet address from MetaMask/WalletConnect.",
            }

        try:
            perps_state, spot_state = await asyncio.gather(
                self.client.get_account_state(address, market_type="perps", raise_on_error=True),
                self.client.get_account_state(address, market_type="spot"),
            )
        except SodexApiError as exc:
            return {
                "account_id": None,
                "trades_imported": 0,
                "snapshots_imported": 0,
                "account_state_found": False,
                "error": exc.message,
                "warnings": [exc.message],
            }
        account_state = perps_state or spot_state
        account_id = None
        if account_state:
            account_id = account_state.get("aid") or account_state.get("accountID")
            if sodex_account:
                sodex_account.raw_state = account_state
                sodex_account.last_synced_at = datetime.now(timezone.utc)
                if account_id:
                    sodex_account.account_id = int(account_id)
            elif account_id and wallet_id:
                sodex_account = SodexAccount(
                    user_id=user_id,
                    wallet_id=wallet_id,
                    account_id=int(account_id),
                    environment="testnet",
                    market_type="perps",
                    raw_state=account_state,
                    last_synced_at=datetime.now(timezone.utc),
                )
                db.add(sodex_account)
                await db.flush()

        raw_trades, spot_trades = await asyncio.gather(
            self.client.get_trades(address, limit=200, market_type="perps"),
            self.client.get_trades(address, limit=200, market_type="spot"),
        )
        if not raw_trades:
            raw_trades = await self.client.get_trades(
                address, symbol=self.DEFAULT_SYMBOL, limit=200, market_type="perps"
            )
        combined_trades = raw_trades + [t for t in spot_trades if t not in raw_trades]

        trades_imported = await self._import_trades(db, user_id, sodex_account, combined_trades)
        trade_symbols = {
            str(t.get("symbol") or t.get("symbolName") or t.get("name"))
            for t in combined_trades
            if t.get("symbol") or t.get("symbolName") or t.get("name")
        }
        if not trade_symbols:
            trade_symbols = {self.DEFAULT_SYMBOL}
        snapshots_imported = 0
        for sym in trade_symbols:
            snapshots_imported += await self._import_orderbook_snapshots(db, sym)

        return {
            "account_id": account_id,
            "trades_imported": trades_imported,
            "snapshots_imported": snapshots_imported,
            "account_state_found": account_state is not None,
            "wallet_address": address,
            "spot_balance": spot_state.get("B") if spot_state else None,
            "perps_positions": perps_state.get("P") if perps_state else None,
        }

    async def _import_trades(
        self,
        db: AsyncSession,
        user_id: UUID,
        sodex_account: SodexAccount | None,
        raw_trades: list[dict[str, Any]],
    ) -> int:
        imported = 0
        pending: list[tuple[str, dict[str, Any]]] = []
        for raw in raw_trades:
            external_id = (
                raw.get("tradeID")
                or raw.get("tradeId")
                or raw.get("id")
                or raw.get("fillId")
                or raw.get("tid")
            )
            if external_id is None:
                continue
            pending.append((str(external_id), raw))

        if not pending:
            return 0

        existing_result = await db.execute(
            select(Trade.external_trade_id).where(
                Trade.user_id == user_id,
                Trade.external_trade_id.in_([external_id for external_id, _ in pending]),
            )
        )
        existing_ids = set(existing_result.scalars().all())

        for external_id, raw in pending:
            if external_id in existing_ids:
                continue

            symbol_raw = raw.get("symbol") or raw.get("symbolName") or raw.get("name")
            if not symbol_raw:
                continue
            symbol = str(symbol_raw)[:32]
            side = self._normalize_side(raw.get("side"))
            price_raw = raw.get("price") or raw.get("avgPrice") or raw.get("px")
            qty_raw = raw.get("quantity") or raw.get("size") or raw.get("qty") or raw.get("amount")
            ts_raw = raw.get("timestamp") or raw.get("time") or raw.get("createdAt") or raw.get("t")
            if price_raw is None or qty_raw is None or ts_raw is None:
                continue
            price = Decimal(str(price_raw))
            quantity = Decimal(str(qty_raw))
            pnl = raw.get("realizedPnl") or raw.get("realized_pnl") or raw.get("pnl") or raw.get("closedPnl")
            executed_at = self._parse_ts(ts_raw)
            if executed_at is None:
                continue

            enriched = dict(raw)
            orderbook = await self.client.get_orderbook(symbol, market_type="perps")
            if orderbook:
                spread_bps = self._spread_from_orderbook(orderbook)
                if spread_bps is not None:
                    enriched["spread_bps"] = float(spread_bps)
                await self._import_orderbook_snapshots(db, symbol, timestamp=executed_at, orderbook=orderbook)

            trade = Trade(
                user_id=user_id,
                sodex_account_id=sodex_account.id if sodex_account else None,
                external_trade_id=external_id,
                symbol=symbol,
                market_type="perps",
                side=side,
                order_type=str(raw.get("type") or raw.get("orderType") or "market"),
                quantity=quantity,
                price=price,
                notional_usd=price * quantity if price and quantity else Decimal("0"),
                fee_usd=Decimal(str(raw.get("fee") or 0)),
                realized_pnl_usd=Decimal(str(pnl)) if pnl is not None else None,
                executed_at=executed_at,
                raw_payload=enriched,
            )
            db.add(trade)
            imported += 1
        return imported

    async def _import_orderbook_snapshots(
        self,
        db: AsyncSession,
        symbol: str,
        *,
        timestamp: datetime | None = None,
        orderbook: dict[str, Any] | None = None,
    ) -> int:
        orderbook = orderbook or await self.client.get_orderbook(symbol)
        if not orderbook:
            return 0

        bids = orderbook.get("bids") or orderbook.get("bid") or []
        asks = orderbook.get("asks") or orderbook.get("ask") or []
        if not bids and not asks:
            return 0

        best_bid = Decimal(str(bids[0][0] if isinstance(bids[0], list) else bids[0].get("price", 0)))
        best_ask = Decimal(str(asks[0][0] if isinstance(asks[0], list) else asks[0].get("price", 0)))
        mid = (best_bid + best_ask) / 2 if best_bid and best_ask else best_bid or best_ask
        spread_bps = ((best_ask - best_bid) / mid * 10000) if mid else Decimal("0")

        bid_depth = sum(
            Decimal(str(level[1] if isinstance(level, list) else level.get("size", 0)))
            for level in bids[:10]
        )
        ask_depth = sum(
            Decimal(str(level[1] if isinstance(level, list) else level.get("size", 0)))
            for level in asks[:10]
        )
        total = bid_depth + ask_depth
        imbalance = (bid_depth - ask_depth) / total if total else Decimal("0")

        snapshot = LiquiditySnapshot(
            symbol=symbol,
            market_type="perps",
            timestamp=timestamp or datetime.now(timezone.utc),
            mid_price=mid,
            best_bid=best_bid,
            best_ask=best_ask,
            spread_bps=spread_bps,
            bid_depth_1pct=bid_depth,
            ask_depth_1pct=ask_depth,
            bid_depth_5pct=bid_depth,
            ask_depth_5pct=ask_depth,
            imbalance_score=imbalance,
            volatility_1m=Decimal("0"),
            volatility_5m=Decimal("0"),
            volatility_1h=Decimal("0"),
            raw_orderbook=orderbook,
        )
        db.add(snapshot)
        return 1

    def _normalize_side(self, side: Any) -> str:
        normalized = str(side or "").upper()
        if side in (1, "1") or normalized in ("BUY", "LONG"):
            return "long"
        if side in (2, "2") or normalized in ("SELL", "SHORT"):
            return "short"
        return str(side or "long")

    def _spread_from_orderbook(self, orderbook: dict[str, Any]) -> Decimal | None:
        bids = orderbook.get("bids") or []
        asks = orderbook.get("asks") or []
        if not bids or not asks:
            return None
        best_bid = Decimal(str(bids[0][0] if isinstance(bids[0], list) else bids[0].get("price", 0)))
        best_ask = Decimal(str(asks[0][0] if isinstance(asks[0], list) else asks[0].get("price", 0)))
        mid = (best_bid + best_ask) / 2 if best_bid and best_ask else best_bid or best_ask
        if not mid:
            return None
        return ((best_ask - best_bid) / mid * 10000).quantize(Decimal("0.0001"))

    def _parse_ts(self, value: Any) -> datetime | None:
        if value is None:
            return None
        if isinstance(value, (int, float)):
            if value > 1_000_000_000_000:
                value = value / 1000
            return datetime.fromtimestamp(value, tz=timezone.utc)
        try:
            return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        except ValueError:
            return None
