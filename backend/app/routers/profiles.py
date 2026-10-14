"""Business profile CRUD endpoints."""
import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from app.schemas.business_profile import (
    BusinessProfileCreate,
    BusinessProfileUpdate,
    BusinessProfileResponse
)
from app.database import get_db

router = APIRouter(prefix="/api/profiles", tags=["Business Profiles"])

def row_to_profile(row) -> BusinessProfileResponse:
    return BusinessProfileResponse(
        id=row["id"],
        name=row["name"],
        category=row["category"],
        description=row["description"],
        location=row["location"],
        business_hours=row["business_hours"],
        target_audience=row["target_audience"],
        tone=row["tone"],
        language=row["language"],
        contact_phone=row["contact_phone"] or "",
        contact_email=row["contact_email"] or "",
        website_url=row["website_url"] or "",
        products_services=json.loads(row["products_services"] or "[]"),
        is_active=bool(row["is_active"]),
        created_at=row["created_at"],
        updated_at=row["updated_at"]
    )

@router.get("", response_model=List[BusinessProfileResponse])
async def list_profiles():
    """List all business profiles."""
    async with get_db() as db:
        cursor = await db.execute("SELECT * FROM business_profiles ORDER BY is_active DESC, updated_at DESC;")
        rows = await cursor.fetchall()
        return [row_to_profile(r) for r in rows]

@router.post("", response_model=BusinessProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(profile_in: BusinessProfileCreate):
    """Create a new business profile."""
    profile_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    products_json = json.dumps([item.model_dump() for item in profile_in.products_services])

    async with get_db() as db:
        # Check if this is the first profile; if so, make it active
        cursor = await db.execute("SELECT COUNT(*) FROM business_profiles;")
        count = (await cursor.fetchone())[0]
        is_active = 1 if count == 0 else 0

        await db.execute("""
            INSERT INTO business_profiles (
                id, name, category, description, location, business_hours,
                target_audience, tone, language, contact_phone, contact_email,
                website_url, products_services, is_active, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            profile_id,
            profile_in.name,
            profile_in.category,
            profile_in.description,
            profile_in.location,
            profile_in.business_hours,
            profile_in.target_audience,
            profile_in.tone,
            profile_in.language,
            profile_in.contact_phone,
            profile_in.contact_email,
            profile_in.website_url,
            products_json,
            is_active,
            now_iso,
            now_iso
        ))
        await db.commit()

        cursor = await db.execute("SELECT * FROM business_profiles WHERE id = ?;", (profile_id,))
        row = await cursor.fetchone()
        return row_to_profile(row)

@router.get("/{profile_id}", response_model=BusinessProfileResponse)
async def get_profile(profile_id: str):
    """Retrieve a specific business profile by ID."""
    async with get_db() as db:
        cursor = await db.execute("SELECT * FROM business_profiles WHERE id = ?;", (profile_id,))
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Business profile not found")
        return row_to_profile(row)

@router.put("/{profile_id}", response_model=BusinessProfileResponse)
async def update_profile(profile_id: str, profile_update: BusinessProfileUpdate):
    """Update business profile details."""
    async with get_db() as db:
        cursor = await db.execute("SELECT * FROM business_profiles WHERE id = ?;", (profile_id,))
        existing = await cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Business profile not found")

        current = row_to_profile(existing)
        data = profile_update.model_dump(exclude_unset=True)

        name = data.get("name", current.name)
        category = data.get("category", current.category)
        description = data.get("description", current.description)
        location = data.get("location", current.location)
        business_hours = data.get("business_hours", current.business_hours)
        target_audience = data.get("target_audience", current.target_audience)
        tone = data.get("tone", current.tone)
        language = data.get("language", current.language)
        contact_phone = data.get("contact_phone", current.contact_phone)
        contact_email = data.get("contact_email", current.contact_email)
        website_url = data.get("website_url", current.website_url)
        is_active = int(data.get("is_active", current.is_active))
        
        if "products_services" in data and data["products_services"] is not None:
            products_json = json.dumps([item.model_dump() if hasattr(item, "model_dump") else item for item in data["products_services"]])
        else:
            products_json = json.dumps([item.model_dump() for item in current.products_services])

        now_iso = datetime.now(timezone.utc).isoformat()

        await db.execute("""
            UPDATE business_profiles SET
                name = ?, category = ?, description = ?, location = ?,
                business_hours = ?, target_audience = ?, tone = ?, language = ?,
                contact_phone = ?, contact_email = ?, website_url = ?,
                products_services = ?, is_active = ?, updated_at = ?
            WHERE id = ?
        """, (
            name, category, description, location, business_hours, target_audience,
            tone, language, contact_phone, contact_email, website_url,
            products_json, is_active, now_iso, profile_id
        ))
        await db.commit()

        cursor = await db.execute("SELECT * FROM business_profiles WHERE id = ?;", (profile_id,))
        row = await cursor.fetchone()
        return row_to_profile(row)

@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile(profile_id: str):
    """Delete a business profile and associated history."""
    async with get_db() as db:
        cursor = await db.execute("SELECT id FROM business_profiles WHERE id = ?;", (profile_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Business profile not found")
        await db.execute("DELETE FROM business_profiles WHERE id = ?;", (profile_id,))
        await db.commit()

@router.post("/{profile_id}/active", response_model=BusinessProfileResponse)
async def set_active_profile(profile_id: str):
    """Set the profile as currently active (single active profile convention)."""
    async with get_db() as db:
        cursor = await db.execute("SELECT * FROM business_profiles WHERE id = ?;", (profile_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Business profile not found")
        
        await db.execute("UPDATE business_profiles SET is_active = 0;")
        await db.execute("UPDATE business_profiles SET is_active = 1 WHERE id = ?;", (profile_id,))
        await db.commit()

        cursor = await db.execute("SELECT * FROM business_profiles WHERE id = ?;", (profile_id,))
        row = await cursor.fetchone()
        return row_to_profile(row)
