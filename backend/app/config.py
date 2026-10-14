"""Configuration module for LocalBiz AI backend."""
import os
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator

class Settings(BaseSettings):
    app_name: str = "LocalBiz AI"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # LM Studio Configuration
    lm_studio_base_url: str = Field(default="http://localhost:1234/v1")
    lm_studio_model: str = Field(default="google/gemma-3-4b")
    lm_studio_api_key: str = Field(default="")
    lm_studio_timeout: float = Field(default=90.0)
    
    # Database Configuration
    db_path: str = Field(default="data/localbiz.db")
    
    # CORS (Strict origins without wildcard when allow_credentials=True)
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]

    @field_validator("lm_studio_timeout", mode="before")
    @classmethod
    def parse_timeout(cls, v):
        if v is None or v == "":
            return 90.0
        try:
            return float(v)
        except (ValueError, TypeError):
            return 90.0

    @field_validator("lm_studio_base_url", mode="before")
    @classmethod
    def parse_base_url(cls, v):
        if not v or str(v).strip() == "":
            return "http://localhost:1234/v1"
        return str(v).strip()

    @field_validator("lm_studio_model", mode="before")
    @classmethod
    def parse_model(cls, v):
        if not v or str(v).strip() == "":
            return "google/gemma-3-4b"
        return str(v).strip()

    @field_validator("db_path", mode="before")
    @classmethod
    def parse_db_path(cls, v):
        if not v or str(v).strip() == "":
            return "data/localbiz.db"
        return str(v).strip()

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
