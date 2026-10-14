"""Generation history router."""
import json
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Query
from app.schemas.generation import HistoryResponse, HistoryUpdateRequest
from app.database import get_db

router = APIRouter(prefix="/api/history", tags=["Content History"])

def row_to_history(row) -> HistoryResponse:
    warnings = json.loads(row["factual_warnings"] or "[]") if isinstance(row["factual_warnings"], str) else []
    return HistoryResponse(
        id=row["id"],
        profile_id=row["profile_id"],
        content_type=row["content_type"],
        topic_or_offer=row["topic_or_offer"],
        tone=row["tone"],
        language=row["language"],
        target_audience=row["target_audience"],
        raw_prompt=row["raw_prompt"],
        generated_content=row["generated_content"],
        edited_content=row["edited_content"],
        model_used=row["model_used"],
        factual_warnings=warnings,
        created_at=row["created_at"],
        updated_at=row["updated_at"]
    )

@router.get("", response_model=List[HistoryResponse])
async def list_history(
    profile_id: Optional[str] = Query(None, description="Filter by business profile ID"),
    content_type: Optional[str] = Query(None, description="Filter by content type")
):
    """Retrieve saved content generations with optional filtering."""
    query = "SELECT * FROM content_history"
    params = []
    clauses = []

    if profile_id:
        clauses.append("profile_id = ?")
        params.append(profile_id)
    if content_type:
        clauses.append("content_type = ?")
        params.append(content_type)

    if clauses:
        query += " WHERE " + " AND ".join(clauses)

    query += " ORDER BY created_at DESC;"

    async with get_db() as db:
        cursor = await db.execute(query, tuple(params))
        rows = await cursor.fetchall()
        return [row_to_history(r) for r in rows]

@router.get("/{history_id}", response_model=HistoryResponse)
async def get_history_item(history_id: str):
    """Get single history record by ID."""
    async with get_db() as db:
        cursor = await db.execute("SELECT * FROM content_history WHERE id = ?;", (history_id,))
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Content history entry not found.")
        return row_to_history(row)

@router.put("/{history_id}", response_model=HistoryResponse)
async def update_history_item(history_id: str, update: HistoryUpdateRequest):
    """Update edited content for a history record."""
    now_iso = datetime.now(timezone.utc).isoformat()
    async with get_db() as db:
        cursor = await db.execute("SELECT * FROM content_history WHERE id = ?;", (history_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Content history entry not found.")

        await db.execute("""
            UPDATE content_history SET edited_content = ?, updated_at = ? WHERE id = ?;
        """, (update.edited_content, now_iso, history_id))
        await db.commit()

        cursor = await db.execute("SELECT * FROM content_history WHERE id = ?;", (history_id,))
        row = await cursor.fetchone()
        return row_to_history(row)

@router.delete("/{history_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_history_item(history_id: str):
    """Delete a history item."""
    async with get_db() as db:
        cursor = await db.execute("SELECT id FROM content_history WHERE id = ?;", (history_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Content history entry not found.")
        await db.execute("DELETE FROM content_history WHERE id = ?;", (history_id,))
        await db.commit()
