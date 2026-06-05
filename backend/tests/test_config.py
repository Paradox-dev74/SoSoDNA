from app.core.config import Settings


def test_demo_mode_defaults_false():
    settings = Settings(demo_mode=False, app_env="production")
    assert settings.demo_mode is False
    assert settings.allow_demo_auth_bypass is False


def test_demo_bypass_only_local():
    settings = Settings(demo_mode=True, app_env="local")
    assert settings.allow_demo_auth_bypass is True

    prod = Settings(demo_mode=True, app_env="production")
    assert prod.allow_demo_auth_bypass is False


def test_async_database_url_normalizes_neon_postgres_url():
    settings = Settings(database_url="postgresql://user:pass@host/db?sslmode=require")
    assert settings.async_database_url == "postgresql+asyncpg://user:pass@host/db"


def test_cors_origin_list_includes_frontend_url():
    settings = Settings(
        cors_origins="http://localhost:5173",
        frontend_url="https://soso-dna.vercel.app",
    )
    assert "https://soso-dna.vercel.app" in settings.cors_origin_list


def test_neon_urls_enable_ssl_and_sync_normalization():
    settings = Settings(
        database_url="postgresql://user:pass@ep-test.neon.tech/neondb?sslmode=require",
        database_url_sync="postgres://user:pass@ep-test.neon.tech/neondb?sslmode=require",
    )
    assert settings.database_requires_ssl is True
    assert settings.async_database_url.startswith("postgresql+asyncpg://")
    assert settings.sync_database_url.startswith("postgresql://")


def test_production_sync_url_falls_back_from_sqlite_to_database_url():
    settings = Settings(
        app_env="production",
        database_url="postgresql://user:pass@ep-test.neon.tech/neondb?sslmode=require",
        database_url_sync="sqlite:///./liquidity_dna.db",
    )
    assert settings.sync_database_url.startswith("postgresql://")
    assert "neon.tech" in settings.sync_database_url


def test_asyncpg_url_strips_libpq_query_params():
    settings = Settings(
        database_url=(
            "postgresql://user:pass@ep-test-pooler.neon.tech/neondb"
            "?sslmode=require&channel_binding=require"
        ),
    )
    assert settings.uses_neon_pooler is True
    assert "sslmode" not in settings.async_database_url
    assert settings.async_database_url.startswith("postgresql+asyncpg://")


def test_cors_origins_strip_trailing_slash():
    settings = Settings(cors_origins="https://soso-dna.vercel.app/")
    assert settings.cors_origin_list == ["https://soso-dna.vercel.app"]
