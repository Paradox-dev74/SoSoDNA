from typing import Any

import httpx

from app.core.config import get_settings

settings = get_settings()

SYMBOL_ALIASES = {
    "BTC-PERP": "BTC-USD",
    "ETH-PERP": "ETH-USD",
    "SOL-PERP": "SOL-USD",
}


class SodexClient:
    """Typed adapter for SoDEX REST APIs (testnet-gw.sodex.dev)."""

    def __init__(self) -> None:
        self.perps_base = settings.sodex_perps_rest.rstrip("/")
        self.spot_base = settings.sodex_spot_rest.rstrip("/")
        self.timeout = httpx.Timeout(8.0)

    def normalize_symbol(self, symbol: str) -> str:
        return SYMBOL_ALIASES.get(symbol.upper(), symbol)

    def _unwrap(self, payload: Any) -> Any:
        if isinstance(payload, dict):
            if payload.get("code") == 0 and "data" in payload:
                return payload["data"]
            if payload.get("code") not in (None, 0) and "error" in payload:
                return None
        return payload

    async def _get(self, url: str, params: dict | None = None) -> Any | None:
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params=params, headers={"Accept": "application/json"})
                if response.status_code == 200:
                    return self._unwrap(response.json())
        except httpx.HTTPError:
            return None
        return None

    def _base(self, market_type: str) -> str:
        return self.perps_base if market_type == "perps" else self.spot_base

    async def get_account_state(self, user_address: str, market_type: str = "perps") -> dict[str, Any] | None:
        address = user_address.lower()
        if not address.startswith("0x") or len(address) != 42:
            return None
        url = f"{self._base(market_type)}/accounts/{address}/state"
        data = await self._get(url)
        return data if isinstance(data, dict) else None

    async def get_trades(
        self,
        user_address: str,
        symbol: str | None = None,
        market_type: str = "perps",
        limit: int = 200,
    ) -> list[dict[str, Any]]:
        address = user_address.lower()
        if not address.startswith("0x") or len(address) != 42:
            return []

        params: dict[str, Any] = {"limit": limit}
        if symbol:
            params["symbol"] = self.normalize_symbol(symbol)

        url = f"{self._base(market_type)}/accounts/{address}/trades"
        data = await self._get(url, params)
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            for key in ("trades", "fills", "items"):
                if isinstance(data.get(key), list):
                    return data[key]
        return []

    async def get_positions(self, user_address: str, market_type: str = "perps") -> list[dict[str, Any]]:
        state = await self.get_account_state(user_address, market_type)
        if not state:
            return []
        positions = state.get("P") or state.get("positions") or []
        return positions if isinstance(positions, list) else []

    async def get_orderbook(self, symbol: str, market_type: str = "perps", limit: int = 20) -> dict[str, Any] | None:
        normalized = self.normalize_symbol(symbol)
        url = f"{self._base(market_type)}/markets/{normalized}/orderbook"
        data = await self._get(url, {"limit": limit})
        if isinstance(data, dict) and (data.get("bids") or data.get("asks")):
            return data
        return None

    async def get_symbols(self, market_type: str = "perps") -> list[dict[str, Any]]:
        url = f"{self._base(market_type)}/markets/symbols"
        data = await self._get(url)
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            return data.get("symbols", data.get("data", []))
        return []
