import importlib.util

from app.core.config import Settings
from app.services.auth_service import AuthService


def test_no_demo_seed_module():
    assert importlib.util.find_spec("app.services.demo_seed") is None


def test_demo_auth_bypass_removed_from_auth_service_source():
    import inspect

    source = inspect.getsource(AuthService.verify_and_login)
    assert "demo_bypass" not in source
    assert "0x0000" not in source


def test_create_all_gated_to_local():
    import inspect
    from app import main

    source = inspect.getsource(main.lifespan)
    assert "is_local" in source
    assert "create_all" in source


def test_production_demo_bypass_disabled():
    settings = Settings(demo_mode=True, app_env="production")
    assert settings.allow_demo_auth_bypass is False


def test_redis_memory_fallback_local_only():
    import inspect
    from app.core import redis_client

    source = inspect.getsource(redis_client.cache_set)
    assert "_allow_memory_fallback" in source


def test_trade_forensics_mock_graph_removed():
    import importlib.util

    assert importlib.util.find_spec("app.ai.graphs.trade_forensics") is None


def test_sodex_client_raises_on_error_flag():
    import inspect
    from app.integrations.sodex import client

    source = inspect.getsource(client.SodexClient._get)
    assert "raise_on_error" in source
    assert "SodexApiError" in source
