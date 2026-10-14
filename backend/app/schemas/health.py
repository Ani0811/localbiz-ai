"""Pydantic schemas for health and diagnostics."""
from pydantic import BaseModel
from typing import Optional, List

class BackendHealthResponse(BaseModel):
    status: str
    database: str
    app_version: str
    active_profile_count: int

class AIHealthResponse(BaseModel):
    status: str  # "connected", "no_model_loaded", "unreachable", "model_loaded"
    base_url: str
    configured_model: str
    is_reachable: bool
    is_model_loaded: bool
    loaded_models: List[str] = []
    available_models: List[str] = []
    setup_instructions: List[str] = []
    error_detail: Optional[str] = None
