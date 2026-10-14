"""Content generation router."""
import json
from fastapi import APIRouter, HTTPException, status
from app.schemas.generation import GenerationRequest, GenerationResponse
from app.services.content_generator import generate_and_save_content
from app.services.lm_studio_provider import LMStudioError, LMStudioConnectionError, LMStudioTimeoutError
from app.database import get_db

router = APIRouter(prefix="/api/generate", tags=["Generation"])

@router.post("", response_model=GenerationResponse, status_code=status.HTTP_201_CREATED)
async def generate_marketing_content(request: GenerationRequest):
    """Generate marketing copy using LM Studio with factual accuracy safeguards."""
    async with get_db() as db:
        cursor = await db.execute("SELECT * FROM business_profiles WHERE id = ?;", (request.profile_id,))
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"Business profile with ID '{request.profile_id}' not found.")

        profile = {
            "id": row["id"],
            "name": row["name"],
            "category": row["category"],
            "description": row["description"],
            "location": row["location"],
            "business_hours": row["business_hours"],
            "target_audience": row["target_audience"],
            "tone": row["tone"],
            "language": row["language"],
            "contact_phone": row["contact_phone"] or "",
            "contact_email": row["contact_email"] or "",
            "website_url": row["website_url"] or "",
            "products_services": json.loads(row["products_services"] or "[]")
        }

    try:
        response = await generate_and_save_content(profile, request)
        return response
    except LMStudioConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "message": e.message,
                "setup_help": e.setup_help
            }
        )
    except LMStudioTimeoutError as e:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail={
                "message": e.message,
                "setup_help": e.setup_help
            }
        )
    except LMStudioError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"message": e.message, "setup_help": e.setup_help}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": f"Unexpected generation failure: {str(e)}"}
        )
