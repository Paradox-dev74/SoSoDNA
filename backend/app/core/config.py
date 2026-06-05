from functools import lru_cache
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
        origins = [o.strip() for o in self.cors_origins.split(",") if o.strip()]
        if self.frontend_url:
            url = self.frontend_url.strip().rstrip("/")
            if url and url not in origins:
                origins.append(url)
        return origins

    @property
    def async_database_url(self) -> str:
        """Neon/Vercel Postgres URLs are often sync `postgresql://`; SQLAlchemy async needs asyncpg."""
        url = self.database_url
        if "+asyncpg" in url or "+psycopg" in url:
            return url
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+asyncpg://", 1)
        return url

    @property
    def is_local(self) -> bool:
        return self.app_env.lower() == "local"

    @property
    def allow_demo_auth_bypass(self) -> bool:
        return self.is_local and self.demo_mode


@lru_cache
def get_settings() -> Settings:
    return Settings()
