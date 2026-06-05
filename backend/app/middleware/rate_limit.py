import time
from collections import defaultdict

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import JSONResponse

RATE_LIMITED_PATHS = {
    "/api/v1/auth/nonce": (10, 60),
    "/api/v1/auth/verify": (5, 60),
    "/api/v1/sodex/sync": (3, 60),
}

_buckets: dict[str, list[float]] = defaultdict(list)


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.method == "OPTIONS":
            return await call_next(request)

        path = request.url.path
        limit_rule = RATE_LIMITED_PATHS.get(path)
        if not limit_rule:
            return await call_next(request)

        max_requests, window_seconds = limit_rule
        client_ip = request.client.host if request.client else "unknown"
        key = f"{path}:{client_ip}"
        now = time.time()
        _buckets[key] = [ts for ts in _buckets[key] if now - ts < window_seconds]

        if len(_buckets[key]) >= max_requests:
            return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded. Try again shortly."})

        _buckets[key].append(now)
        return await call_next(request)
