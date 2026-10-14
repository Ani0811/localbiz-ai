"""Health check endpoints for backend and LM Studio AI."""
from fastapi import APIRouter, status
from app.schemas.health import BackendHealthResponse, AIHealthResponse
from app.services.lm_studio_provider import lm_provider
from app.database import get_db
from app.config import settings

router = APIRouter(prefix="/api/health", tags=["Health"])

@router.get("", response_model=BackendHealthResponse)
async def check_backend_health():
    """Verify backend and database operational state."""
    db_status = "ok"
    active_count = 0
    try:
        async with get_db() as db:
            cursor = await db.execute("SELECT COUNT(*) FROM business_profiles WHERE is_active = 1;")
            row = await cursor.fetchone()
            active_count = row[0] if row else 0
    except Exception as e:
        db_status = f"error: {str(e)}"

    return BackendHealthResponse(
        status="ok" if db_status == "ok" else "degraded",
        database=db_status,
        app_version=settings.app_version,
        active_profile_count=active_count
    )

@router.get("/ai", response_model=AIHealthResponse)
async def check_ai_health():
    """Verify LM Studio connectivity, loaded models, and actionable setup help."""
    return await lm_provider.check_health()
