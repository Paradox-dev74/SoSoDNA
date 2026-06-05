import re

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import Settings


class EnsureCorsHeadersMiddleware(BaseHTTPMiddleware):
    """Guarantee CORS headers on every response, including 5xx JSON errors."""

    def __init__(self, app, settings: Settings) -> None:
        super().__init__(app)
        self._settings = settings
        self._regex = (
            re.compile(settings.cors_origin_regex) if settings.cors_origin_regex else None
        )

    def _allows_origin(self, origin: str) -> bool:
        if origin in self._settings.cors_origin_list:
            return True
        return bool(self._regex and self._regex.fullmatch(origin))

    def _apply(self, request: Request, response: Response) -> Response:
        origin = request.headers.get("origin")
        if origin and self._allows_origin(origin):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers.setdefault("Vary", "Origin")
        return response

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
        return self._apply(request, response)
