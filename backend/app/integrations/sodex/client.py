import json
from typing import Any

import httpx
from eth_utils import keccak

from app.core.config import get_settings
from app.integrations.sodex.errors import SodexApiError

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
        self.timeout = httpx.Timeout(12.0)

    def normalize_symbol(self, symbol: str) -> str:
        return SYMBOL_ALIASES.get(symbol.upper(), symbol)

    def _unwrap(self, payload: Any) -> Any:
        if isinstance(payload, dict):
            if payload.get("code") == 0 and "data" in payload:
                return payload["data"]
            if payload.get("code") not in (None, 0):
                return None
        return payload

    async def _get(
        self,
        url: str,
        params: dict | None = None,
        *,
        raise_on_error: bool = False,
    ) -> Any | None:
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params=params, headers={"Accept": "application/json"})
                if response.status_code == 200:
                    body = response.json()
                    if isinstance(body, dict) and body.get("code") not in (None, 0):
                        if raise_on_error:
                            raise SodexApiError(
                                body.get("error") or body.get("message") or "SoDEX API error",
                                status_code=response.status_code,
                                url=url,
                                code=body.get("code"),
                            )
                        return None
                    return self._unwrap(body)
                if raise_on_error:
                    raise SodexApiError(
                        f"SoDEX HTTP {response.status_code}",
                        status_code=response.status_code,
                        url=url,
                    )
        except httpx.HTTPError as exc:
            if raise_on_error:
                raise SodexApiError(f"SoDEX unreachable: {exc}", url=url) from exc
        return None

    async def _post_signed(
        self,
        url: str,
        body: dict[str, Any],
        *,
        api_key_name: str,
        api_sign: str,
        api_nonce: str,
    ) -> dict[str, Any]:
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-API-Key": api_key_name,
            "X-API-Sign": api_sign,
            "X-API-Nonce": api_nonce,
        }
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, json=body, headers=headers)
                payload = response.json()
                if response.status_code >= 400:
                    raise SodexApiError(
                        payload.get("error") or payload.get("message") or f"SoDEX HTTP {response.status_code}",
                        status_code=response.status_code,
                        url=url,
                        code=payload.get("code") if isinstance(payload, dict) else None,
                    )
                if isinstance(payload, dict):
                    return payload
                return {"code": 0, "data": payload}
        except httpx.HTTPError as exc:
            raise SodexApiError(f"SoDEX unreachable: {exc}", url=url) from exc

    def _base(self, market_type: str) -> str:
        return self.perps_base if market_type == "perps" else self.spot_base

    async def get_account_state(
        self,
        user_address: str,
        market_type: str = "perps",
        *,
        raise_on_error: bool = False,
    ) -> dict[str, Any] | None:
        address = user_address.lower()
        if not address.startswith("0x") or len(address) != 42:
            if raise_on_error:
                raise SodexApiError("Invalid wallet address format.")
            return None
        url = f"{self._base(market_type)}/accounts/{address}/state"
        data = await self._get(url, raise_on_error=raise_on_error)
        return data if isinstance(data, dict) else None

    async def get_trades(
        self,
        user_address: str,
        symbol: str | None = None,
        market_type: str = "perps",
        limit: int = 200,
        *,
        raise_on_error: bool = False,
    ) -> list[dict[str, Any]]:
        address = user_address.lower()
        if not address.startswith("0x") or len(address) != 42:
            if raise_on_error:
                raise SodexApiError("Invalid wallet address format.")
            return []

        params: dict[str, Any] = {"limit": limit}
        if symbol:
            params["symbol"] = self.normalize_symbol(symbol)

        url = f"{self._base(market_type)}/accounts/{address}/trades"
        data = await self._get(url, params, raise_on_error=raise_on_error)
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

    async def get_orderbook(
        self,
        symbol: str,
        market_type: str = "perps",
        limit: int = 20,
        *,
        raise_on_error: bool = False,
    ) -> dict[str, Any] | None:
        normalized = self.normalize_symbol(symbol)
        url = f"{self._base(market_type)}/markets/{normalized}/orderbook"
        data = await self._get(url, {"limit": limit}, raise_on_error=raise_on_error)
        if isinstance(data, dict) and (data.get("bids") or data.get("asks")):
            return data
        if raise_on_error:
            raise SodexApiError(f"No orderbook data for {normalized}")
        return None

    async def get_symbols(
        self,
        market_type: str = "perps",
        *,
        symbol: str | None = None,
        raise_on_error: bool = False,
    ) -> list[dict[str, Any]]:
        url = f"{self._base(market_type)}/markets/symbols"
        params = {"symbol": self.normalize_symbol(symbol)} if symbol else None
        data = await self._get(url, params, raise_on_error=raise_on_error)
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            return data.get("symbols", data.get("data", []))
        if raise_on_error:
            raise SodexApiError("SoDEX symbols endpoint returned no data")
        return []

    async def get_mark_prices(
        self,
        symbol: str | None = None,
        market_type: str = "perps",
        *,
        raise_on_error: bool = False,
    ) -> list[dict[str, Any]]:
        url = f"{self._base(market_type)}/markets/mark-prices"
        params = {"symbol": self.normalize_symbol(symbol)} if symbol else None
        data = await self._get(url, params, raise_on_error=raise_on_error)
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            return [data]
        return []

    async def submit_signed_order(
        self,
        body: dict[str, Any],
        *,
        api_key_name: str,
        api_sign: str,
        api_nonce: str,
        market_type: str = "perps",
    ) -> dict[str, Any]:
        url = f"{self._base(market_type)}/trade/orders"
        return await self._post_signed(
            url,
            body,
            api_key_name=api_key_name,
            api_sign=api_sign,
            api_nonce=api_nonce,
        )

    @staticmethod
    def compute_payload_hash(body: dict[str, Any]) -> str:
        canonical = json.dumps(body, separators=(",", ":"), ensure_ascii=False)
        return "0x" + keccak(text=canonical).hex()
