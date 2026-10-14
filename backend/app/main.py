"""LocalBiz AI FastAPI Application."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.routers import health, profiles, generate, history

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure SQLite database and schema exist
    await init_db()
    yield

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Local-first AI marketing assistant for local businesses, powered by LM Studio.",
    lifespan=lifespan
)

# CORS Middleware with regex to allow any localhost port seamlessly
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health.router)
app.include_router(profiles.router)
app.include_router(generate.router)
app.include_router(history.router)

@app.get("/", tags=["Root"])
async def root():
    return {
        "app": settings.app_name,
        "version": settings.app_version,
        "docs_url": "/docs",
        "health_url": "/api/health",
        "ai_health_url": "/api/health/ai"
    }
