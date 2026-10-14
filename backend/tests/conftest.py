"""Pytest fixtures for LocalBiz AI backend."""
import pytest
import os
import aiosqlite
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.config import settings
from app.database import init_db

TEST_DB_PATH = "data/test_localbiz.db"

@pytest.fixture(autouse=True)
async def setup_test_db(monkeypatch):
    """Ensure clean test database for each test session."""
    test_db_full = os.path.join(os.path.dirname(__file__), "..", TEST_DB_PATH)
    if os.path.exists(test_db_full):
        try:
            os.remove(test_db_full)
        except OSError:
            pass
            
    monkeypatch.setattr(settings, "db_path", TEST_DB_PATH)
    await init_db()
    yield
    if os.path.exists(test_db_full):
        try:
            os.remove(test_db_full)
        except OSError:
            pass

@pytest.fixture
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

@pytest.fixture
def sample_profile_data():
    return {
        "name": "Bakers Delight",
        "category": "Artisanal Bakery & Cafe",
        "description": "Family-owned sourdough bakery and organic coffee bar.",
        "location": "14 Park Street, Kolkata",
        "business_hours": "Tue-Sun 8:00 AM - 9:00 PM",
        "target_audience": "Local foodies, students, and breakfast regulars",
        "tone": "Warm, inviting, and handcrafted",
        "language": "English",
        "contact_phone": "+91 98765 43210",
        "contact_email": "hello@bakersdelight.in",
        "website_url": "https://bakersdelight.in",
        "products_services": [
            {
                "name": "Classic Sourdough Loaf",
                "description": "36-hour slow fermented country bread",
                "price": "₹180",
                "offer": "Buy 2 get 1 butter croissant free"
            },
            {
                "name": "Cappuccino",
                "description": "Double shot espresso with oat or dairy milk",
                "price": "₹140",
                "offer": ""
            }
        ]
    }
