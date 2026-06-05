import json
import time
from typing import Any

from app.core.config import get_settings

settings = get_settings()
_redis = None
_memory_cache: dict[str, tuple[Any, float]] = {}


class CacheUnavailableError(RuntimeError):
    """Raised when Redis is required but unreachable."""


def _redis_connection_hint() -> str:
    url = settings.redis_url.strip()
    if url.startswith("https://") or url.startswith("http://"):
        return (
            "REDIS_URL must be a Redis connection string (rediss://...), not an HTTPS REST URL. "
            "In Upstash Console → your database → Connect, copy the value starting with rediss://"
        )
    if "upstash.io" in url and not url.startswith(("redis://", "rediss://")):
        return (
            "REDIS_URL for Upstash must start with rediss:// and include the password, "
            "e.g. rediss://default:YOUR_TOKEN@host.upstash.io:6379"
        )
    return "Redis is unavailable. Set REDIS_URL to a reachable Redis instance."


async def get_redis():
    global _redis
    if _redis is None:
        try:
            import redis.asyncio as aioredis
            _redis = aioredis.from_url(
                settings.redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
            )
            await _redis.ping()
        except Exception:
            _redis = False
    return _redis if _redis is not False else None


def _allow_memory_fallback() -> bool:
    return settings.is_local


async def cache_get(key: str) -> Any | None:
    client = await get_redis()
    if client:
        value = await client.get(key)
        if value is None:
            return None
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return value

    if not _allow_memory_fallback():
        return None

    entry = _memory_cache.get(key)
    if entry and entry[1] > time.time():
        return entry[0]
    return None


async def cache_delete(key: str) -> None:
    client = await get_redis()
    if client:
        await client.delete(key)
        return
    if _allow_memory_fallback():
        _memory_cache.pop(key, None)


async def cache_set(key: str, value: Any, ttl: int = 300) -> None:
    client = await get_redis()
    if client:
        await client.set(key, json.dumps(value), ex=ttl)
        return
    if _allow_memory_fallback():
        _memory_cache[key] = (value, time.time() + ttl)
        return
    raise CacheUnavailableError(_redis_connection_hint())


async def publish_event(channel: str, payload: dict[str, Any]) -> None:
    client = await get_redis()
    if client:
        await client.publish(channel, json.dumps(payload))
