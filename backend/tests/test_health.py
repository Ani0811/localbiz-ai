"""Tests for backend and AI health endpoints."""
import pytest
from unittest.mock import AsyncMock, patch
from app.schemas.health import AIHealthResponse

@pytest.mark.asyncio
async def test_backend_health(async_client):
    response = await async_client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "ok"
    assert "app_version" in data

@pytest.mark.asyncio
async def test_ai_health_connected(async_client):
    mock_resp = AIHealthResponse(
        status="model_loaded",
        base_url="http://localhost:1234/v1",
        configured_model="google/gemma-3-4b",
        is_reachable=True,
        is_model_loaded=True,
        loaded_models=["google/gemma-3-4b"],
        available_models=["google/gemma-3-4b"],
        setup_instructions=[]
    )
    with patch("app.services.lm_studio_provider.lm_provider.check_health", new_callable=AsyncMock) as mock_check:
        mock_check.return_value = mock_resp
        response = await async_client.get("/api/health/ai")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "model_loaded"
        assert data["is_reachable"] is True
        assert "google/gemma-3-4b" in data["loaded_models"]

@pytest.mark.asyncio
async def test_ai_health_unreachable(async_client):
    mock_resp = AIHealthResponse(
        status="unreachable",
        base_url="http://localhost:1234/v1",
        configured_model="google/gemma-3-4b",
        is_reachable=False,
        is_model_loaded=False,
        loaded_models=[],
        available_models=[],
        setup_instructions=["Launch LM Studio", "Run lms server start --cors"],
        error_detail="Connection refused"
    )
    with patch("app.services.lm_studio_provider.lm_provider.check_health", new_callable=AsyncMock) as mock_check:
        mock_check.return_value = mock_resp
        response = await async_client.get("/api/health/ai")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "unreachable"
        assert data["is_reachable"] is False
        assert len(data["setup_instructions"]) > 0
