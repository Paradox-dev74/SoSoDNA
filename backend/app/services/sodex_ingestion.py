from datetime import datetime, timezone
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations.sodex.client import SodexClient
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

        perps_state = await self.client.get_account_state(address, market_type="perps")
        spot_state = await self.client.get_account_state(address, market_type="spot")
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

        raw_trades = await self.client.get_trades(address, limit=500, market_type="perps")
        spot_trades = await self.client.get_trades(address, limit=500, market_type="spot")
        if not raw_trades:
            raw_trades = await self.client.get_trades(
                address, symbol=self.DEFAULT_SYMBOL, limit=500, market_type="perps"
            )
        combined_trades = raw_trades + [t for t in spot_trades if t not in raw_trades]

        trades_imported = await self._import_trades(db, user_id, sodex_account, combined_trades)
        snapshots_imported = await self._import_orderbook_snapshots(db, self.DEFAULT_SYMBOL)

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
        for i, raw in enumerate(raw_trades):
            external_id = str(raw.get("id") or raw.get("tradeId") or raw.get("fillId") or raw.get("tid") or f"sodex-{i}")
            existing = await db.execute(
                select(Trade).where(Trade.user_id == user_id, Trade.external_trade_id == external_id)
            )
            if existing.scalar_one_or_none():
                continue

            symbol = str(raw.get("symbol") or raw.get("symbolName") or raw.get("name") or self.DEFAULT_SYMBOL)
            side = self._normalize_side(raw.get("side"))
            price = Decimal(str(raw.get("price") or raw.get("avgPrice") or raw.get("px") or 0))
            quantity = Decimal(str(raw.get("quantity") or raw.get("size") or raw.get("qty") or raw.get("amount") or 0))
            pnl = raw.get("realizedPnl") or raw.get("realized_pnl") or raw.get("pnl") or raw.get("closedPnl")
            executed_at = self._parse_ts(raw.get("timestamp") or raw.get("time") or raw.get("createdAt") or raw.get("t"))

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
                raw_payload=raw,
            )
            db.add(trade)
            imported += 1
        return imported

    async def _import_orderbook_snapshots(self, db: AsyncSession, symbol: str) -> int:
        orderbook = await self.client.get_orderbook(symbol)
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
            timestamp=datetime.now(timezone.utc),
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
        if side in (1, "1", "buy", "long", "BUY", "LONG"):
            return "long"
        if side in (2, "2", "sell", "short", "SELL", "SHORT"):
            return "short"
        return str(side or "long")

    def _parse_ts(self, value: Any) -> datetime:
        if value is None:
            return datetime.now(timezone.utc)
        if isinstance(value, (int, float)):
            if value > 1_000_000_000_000:
                value = value / 1000
            return datetime.fromtimestamp(value, tz=timezone.utc)
        try:
            return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        except ValueError:
            return datetime.now(timezone.utc)
