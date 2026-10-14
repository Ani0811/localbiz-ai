"""Tests for marketing content generation and factual warning checks."""
import pytest
from unittest.mock import patch, AsyncMock
from app.schemas.generation import GenerationRequest, ContentTypeEnum
from app.services.lm_studio_provider import LMStudioConnectionError, LMStudioTimeoutError
from app.services.content_generator import verify_factual_accuracy

@pytest.mark.asyncio
async def test_generation_success_and_history(async_client, sample_profile_data):
    # 1. Create profile
    profile_res = await async_client.post("/api/profiles", json=sample_profile_data)
    profile_id = profile_res.json()["id"]

    # 2. Mock LM Studio generation
    mock_copy = (
        "Warm sourdough straight from our oven! 🍞\n"
        "Visit Bakers Delight at 14 Park Street, Kolkata.\n"
        "Special offer: Buy 2 get 1 butter croissant free!\n"
        "#KolkataFood #BakersDelight #Sourdough"
    )

    with patch("app.services.lm_studio_provider.lm_provider.generate", new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = (mock_copy, "google/gemma-3-4b")

        gen_req = {
            "profile_id": profile_id,
            "content_type": "instagram_caption",
            "specific_offer_or_product": "Classic Sourdough Loaf"
        }
        res = await async_client.post("/api/generate", json=gen_req)
        assert res.status_code == 201
        data = res.json()
        assert data["content_type"] == "instagram_caption"
        assert "Buy 2 get 1 butter croissant free" in data["generated_content"]
        assert data["model_used"] == "google/gemma-3-4b"
        assert len(data["factual_warnings"]) == 0
        history_id = data["id"]

        # 3. Verify history entry
        hist_res = await async_client.get(f"/api/history/{history_id}")
        assert hist_res.status_code == 200
        assert hist_res.json()["id"] == history_id

@pytest.mark.asyncio
async def test_generation_factual_warning_triggered(async_client, sample_profile_data):
    profile_res = await async_client.post("/api/profiles", json=sample_profile_data)
    profile_id = profile_res.json()["id"]

    # Mock copy that hallucinates a 50% discount and $99 price not in profile
    hallucinated_copy = (
        "Get an insane 50% discount on all bread today! Only $99 for our mega bundle!"
    )

    with patch("app.services.lm_studio_provider.lm_provider.generate", new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = (hallucinated_copy, "google/gemma-3-4b")

        gen_req = {
            "profile_id": profile_id,
            "content_type": "promo_copy"
        }
        res = await async_client.post("/api/generate", json=gen_req)
        assert res.status_code == 201
        data = res.json()
        # Should flag 50% and $99 in warnings
        assert len(data["factual_warnings"]) > 0

@pytest.mark.asyncio
async def test_generation_lm_studio_unreachable(async_client, sample_profile_data):
    profile_res = await async_client.post("/api/profiles", json=sample_profile_data)
    profile_id = profile_res.json()["id"]

    with patch("app.services.lm_studio_provider.lm_provider.generate", side_effect=LMStudioConnectionError("Connection refused", setup_help=["Start LM Studio"])):
        gen_req = {
            "profile_id": profile_id,
            "content_type": "whatsapp_message"
        }
        res = await async_client.post("/api/generate", json=gen_req)
        assert res.status_code == 503
        detail = res.json()["detail"]
        assert "Connection refused" in detail["message"]
        assert len(detail["setup_help"]) > 0

@pytest.mark.asyncio
async def test_generation_lm_studio_timeout(async_client, sample_profile_data):
    profile_res = await async_client.post("/api/profiles", json=sample_profile_data)
    profile_id = profile_res.json()["id"]

    with patch("app.services.lm_studio_provider.lm_provider.generate", side_effect=LMStudioTimeoutError("Timed out", setup_help=["Offload GPU"])):
        gen_req = {
            "profile_id": profile_id,
            "content_type": "weekly_content_plan"
        }
        res = await async_client.post("/api/generate", json=gen_req)
        assert res.status_code == 504
