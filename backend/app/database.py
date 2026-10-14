"""SQLite database management with aiosqlite for LocalBiz AI."""
import json
import os
import aiosqlite
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional, Any, AsyncGenerator
from app.config import settings

def get_db_path() -> str:
    path = Path(settings.db_path)
    if not path.is_absolute():
        backend_root = Path(__file__).parent.parent
        path = backend_root / settings.db_path
    path.parent.mkdir(parents=True, exist_ok=True)
    return str(path)

async def init_db():
    """Initialize database tables if they do not exist."""
    db_file = get_db_path()
    async with aiosqlite.connect(db_file) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS business_profiles (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                description TEXT NOT NULL,
                location TEXT NOT NULL,
                business_hours TEXT NOT NULL,
                target_audience TEXT NOT NULL,
                tone TEXT NOT NULL,
                language TEXT NOT NULL,
                contact_phone TEXT,
                contact_email TEXT,
                website_url TEXT,
                products_services TEXT NOT NULL,
                is_active INTEGER DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS content_history (
                id TEXT PRIMARY KEY,
                profile_id TEXT NOT NULL,
                content_type TEXT NOT NULL,
                topic_or_offer TEXT NOT NULL,
                tone TEXT NOT NULL,
                language TEXT NOT NULL,
                target_audience TEXT NOT NULL,
                raw_prompt TEXT NOT NULL,
                generated_content TEXT NOT NULL,
                edited_content TEXT NOT NULL,
                model_used TEXT NOT NULL,
                factual_warnings TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (profile_id) REFERENCES business_profiles(id) ON DELETE CASCADE
            );
        """)
        await db.commit()

@asynccontextmanager
async def get_db() -> AsyncGenerator[aiosqlite.Connection, None]:
    """Yield an active connection to SQLite."""
    async with aiosqlite.connect(get_db_path()) as db:
        db.row_factory = aiosqlite.Row
        await db.execute("PRAGMA foreign_keys = ON;")
        yield db
