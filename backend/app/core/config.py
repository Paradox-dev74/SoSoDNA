from functools import lru_cache
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "production"
    database_url: str = "postgresql+asyncpg://liquidity:liquidity@localhost:5432/liquidity_dna"
    database_url_sync: str = "postgresql://liquidity:liquidity@localhost:5432/liquidity_dna"
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    secret_key: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,https://soso-dna.vercel.app"
    cors_origin_regex: str = r"https://.*\.vercel\.app"
    frontend_url: str = ""

    sodex_env: str = "testnet"
    sodex_spot_rest: str = "https://testnet-gw.sodex.dev/api/v1/spot"
    sodex_perps_rest: str = "https://testnet-gw.sodex.dev/api/v1/perps"
    sodex_spot_ws: str = "wss://testnet-gw.sodex.dev/ws/spot"
    sodex_perps_ws: str = "wss://testnet-gw.sodex.dev/ws/perps"

    sosovalue_api_key: str = ""
    sosovalue_base_url: str = "https://openapi.sosovalue.com/openapi/v1"

    openai_api_key: str = ""
    demo_mode: bool = False
    chain_id: int = 138565
    valuechain_rpc_url: str = "https://testnet-rpc.valuechain.xyz"

    @property
    def cors_origin_list(self) -> list[str]:
        origins = []
        for origin in self.cors_origins.split(","):
            cleaned = origin.strip().rstrip("/")
            if cleaned and cleaned not in origins:
                origins.append(cleaned)
        if self.frontend_url:
            url = self.frontend_url.strip().rstrip("/")
            if url and url not in origins:
                origins.append(url)
        return origins

    @property
    def async_database_url(self) -> str:
        """Neon/Vercel Postgres URLs are often sync `postgresql://`; SQLAlchemy async needs asyncpg."""
        return self._clean_asyncpg_url(self._to_async_database_url(self.database_url))

    @property
    def uses_neon_pooler(self) -> bool:
        return "-pooler" in self.database_url

    @property
    def sync_database_url(self) -> str:
        """Sync driver URL for Alembic/psycopg2."""
        url = self.database_url_sync.strip()
        if not self.is_local and (not url or url.startswith("sqlite")):
            url = self.database_url.strip()
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql://", 1)
        return url

    @staticmethod
    def _to_async_database_url(url: str) -> str:
        if "+asyncpg" in url or "+psycopg" in url:
            return url
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+asyncpg://", 1)
        return url

    @staticmethod
    def _clean_asyncpg_url(url: str) -> str:
        """asyncpg does not understand libpq params like sslmode/channel_binding in the URL."""
        parsed = urlparse(url)
        filtered = [
            (key, value)
            for key, value in parse_qsl(parsed.query, keep_blank_values=True)
            if key not in {"sslmode", "channel_binding", "ssl"}
        ]
        return urlunparse(parsed._replace(query=urlencode(filtered)))

    @property
    def database_requires_ssl(self) -> bool:
        combined = f"{self.database_url} {self.database_url_sync}"
        return any(marker in combined for marker in ("neon.tech", "sslmode=require", "ssl=require"))

    @property
    def is_local(self) -> bool:
        return self.app_env.lower() == "local"

    @property
    def allow_demo_auth_bypass(self) -> bool:
        return self.is_local and self.demo_mode


@lru_cache
def get_settings() -> Settings:
    return Settings()
