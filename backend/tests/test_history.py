"""Tests for content history operations."""
import pytest
from unittest.mock import patch, AsyncMock

@pytest.mark.asyncio
async def test_history_crud(async_client, sample_profile_data):
    # 1. Create profile & generate item
    p_res = await async_client.post("/api/profiles", json=sample_profile_data)
    profile_id = p_res.json()["id"]

    with patch("app.services.lm_studio_provider.lm_provider.generate", new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = ("Original AI generated copy", "google/gemma-3-4b")
        gen_res = await async_client.post("/api/generate", json={
            "profile_id": profile_id,
            "content_type": "product_description"
        })
        history_id = gen_res.json()["id"]

    # 2. List history
    list_res = await async_client.get(f"/api/history?profile_id={profile_id}")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 3. Update edited content
    update_res = await async_client.put(f"/api/history/{history_id}", json={
        "edited_content": "User refined and polished product copy."
    })
    assert update_res.status_code == 200
    assert update_res.json()["edited_content"] == "User refined and polished product copy."
    assert update_res.json()["generated_content"] == "Original AI generated copy"

    # 4. Delete history item
    del_res = await async_client.delete(f"/api/history/{history_id}")
    assert del_res.status_code == 204

    get_del = await async_client.get(f"/api/history/{history_id}")
    assert get_del.status_code == 404
