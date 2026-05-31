import pytest


@pytest.mark.asyncio
async def test_health_endpoint(client):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "soso-dna"


@pytest.mark.asyncio
async def test_integration_health(client):
    response = await client.get("/api/v1/health/integrations")
    assert response.status_code == 200
    data = response.json()
    assert "integrations" in data
    assert "demo_mode" in data
    assert "sosovalue_api_key_configured" in data["integrations"]
