from typing import Any

import httpx

from app.core.config import get_settings
from app.core.redis_client import cache_get, cache_set

settings = get_settings()


class SoSoValueClient:
    """Typed adapter for SoSoValue OpenAPI."""

    def __init__(self) -> None:
        self.base_url = settings.sosovalue_base_url.rstrip("/")
        self.api_key = settings.sosovalue_api_key
        self.timeout = httpx.Timeout(15.0)

    def _headers(self) -> dict[str, str]:
        headers = {"Accept": "application/json"}
        if self.api_key:
            headers["x-soso-api-key"] = self.api_key
        return headers

    def _unwrap(self, payload: Any) -> Any:
        if isinstance(payload, dict) and payload.get("code") == 0 and "data" in payload:
            return payload["data"]
        return payload

    async def _get(self, path: str, cache_key: str | None = None, ttl: int = 300) -> Any:
        if cache_key:
            cached = await cache_get(cache_key)
            if cached is not None:
                return cached

        if not self.api_key:
            return [] if "market" not in path else None

        url = f"{self.base_url}/{path.lstrip('/')}"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, headers=self._headers())
                if response.status_code == 200:
                    data = self._unwrap(response.json())
                    if cache_key:
                        await cache_set(cache_key, data, ttl=ttl)
                    return data
                return [] if "market" not in path else None
        except httpx.HTTPError:
            return [] if "market" not in path else None

    def _extract_list(self, data: Any) -> list[dict[str, Any]]:
        if isinstance(data, list):
            return [item for item in data if isinstance(item, dict)]
        if isinstance(data, dict):
            for key in ("list", "items", "results", "data"):
                value = data.get(key)
                if isinstance(value, list):
                    return [item for item in value if isinstance(item, dict)]
        return []

    async def get_hot_news(self) -> list[dict[str, Any]]:
        data = await self._get("news/hot", cache_key="sosovalue:hot-news", ttl=180)
        return self._extract_list(data)

    async def get_macro_events(self) -> list[dict[str, Any]]:
        data = await self._get("macro/events", cache_key="sosovalue:macro", ttl=600)
        if isinstance(data, list):
            flattened: list[dict[str, Any]] = []
            for day in data:
                if not isinstance(day, dict):
                    continue
                date = day.get("date")
                for event in day.get("events", []):
                    flattened.append(
                        {
                            "id": f"macro-{date}-{event}",
                            "title": str(event),
                            "date": date,
                            "event_type": "macro",
                        }
                    )
            return flattened
        return self._extract_list(data)

    async def get_pair_market(self, symbol: str = "BTC") -> dict[str, Any] | None:
        data = await self._get(f"currency/pairs/market?symbol={symbol}", cache_key=f"sosovalue:pair:{symbol}")
        return data if isinstance(data, dict) else None
