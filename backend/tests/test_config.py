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
