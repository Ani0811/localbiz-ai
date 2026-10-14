"""Tests for business profile CRUD and validation."""
import pytest

@pytest.mark.asyncio
async def test_create_and_get_profile(async_client, sample_profile_data):
    # 1. Create profile
    res = await async_client.post("/api/profiles", json=sample_profile_data)
    assert res.status_code == 201
    created = res.json()
    assert created["name"] == sample_profile_data["name"]
    assert created["is_active"] is True
    assert len(created["products_services"]) == 2
    profile_id = created["id"]

    # 2. Get profile
    res_get = await async_client.get(f"/api/profiles/{profile_id}")
    assert res_get.status_code == 200
    assert res_get.json()["id"] == profile_id

@pytest.mark.asyncio
async def test_update_profile(async_client, sample_profile_data):
    create_res = await async_client.post("/api/profiles", json=sample_profile_data)
    profile_id = create_res.json()["id"]

    update_payload = {
        "name": "Bakers Delight & Roastery",
        "business_hours": "Mon-Sun 7:00 AM - 10:00 PM"
    }
    update_res = await async_client.put(f"/api/profiles/{profile_id}", json=update_payload)
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["name"] == "Bakers Delight & Roastery"
    assert updated["business_hours"] == "Mon-Sun 7:00 AM - 10:00 PM"
    assert updated["category"] == sample_profile_data["category"]

@pytest.mark.asyncio
async def test_delete_profile(async_client, sample_profile_data):
    create_res = await async_client.post("/api/profiles", json=sample_profile_data)
    profile_id = create_res.json()["id"]

    del_res = await async_client.delete(f"/api/profiles/{profile_id}")
    assert del_res.status_code == 204

    get_res = await async_client.get(f"/api/profiles/{profile_id}")
    assert get_res.status_code == 404

@pytest.mark.asyncio
async def test_profile_validation_errors(async_client):
    # Missing required name
    bad_payload = {
        "category": "Cafe",
        "description": "Short",
        "location": "City",
        "business_hours": "9-5",
        "target_audience": "All"
    }
    res = await async_client.post("/api/profiles", json=bad_payload)
    assert res.status_code == 422
