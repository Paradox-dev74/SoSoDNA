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
    assert settings.async_database_url == "postgresql+asyncpg://user:pass@host/db?sslmode=require"


def test_cors_origin_list_includes_frontend_url():
    settings = Settings(
        cors_origins="http://localhost:5173",
        frontend_url="https://soso-dna.vercel.app",
    )
    assert "https://soso-dna.vercel.app" in settings.cors_origin_list
