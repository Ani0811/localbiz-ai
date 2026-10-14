"""Configuration module for LocalBiz AI backend."""
import os
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    app_name: str = "LocalBiz AI"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # LM Studio Configuration
    lm_studio_base_url: str = Field(
        default_factory=lambda: os.getenv("LM_STUDIO_BASE_URL", "http://localhost:1234/v1")
    )
    lm_studio_model: str = Field(
        default_factory=lambda: os.getenv("LM_STUDIO_MODEL", "google/gemma-3-4b")
    )
    lm_studio_api_key: str = Field(
        default_factory=lambda: os.getenv("LM_STUDIO_API_KEY", "")
    )
    lm_studio_timeout: float = Field(
        default_factory=lambda: float(os.getenv("LM_STUDIO_TIMEOUT", "90.0"))
    )
    
    # Database Configuration
    db_path: str = Field(
        default_factory=lambda: os.getenv("DB_PATH", "data/localbiz.db")
    )
    
    # CORS
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "*"
    ]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
