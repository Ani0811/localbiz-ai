"""Pydantic schemas for content generation and history."""
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum

class ContentTypeEnum(str, Enum):
    INSTAGRAM_CAPTION = "instagram_caption"
    PROMO_COPY = "promo_copy"
    WHATSAPP_MESSAGE = "whatsapp_message"
    GOOGLE_BUSINESS_UPDATE = "google_business_update"
    PRODUCT_DESCRIPTION = "product_description"
    WEEKLY_CONTENT_PLAN = "weekly_content_plan"

class LanguageEnum(str, Enum):
    ENGLISH = "English"
    BENGALI = "Bengali"
    BENGALI_ENGLISH = "Bengali-English"

class GenerationRequest(BaseModel):
    profile_id: str = Field(..., description="ID of the business profile to generate content for")
    content_type: ContentTypeEnum = Field(..., description="Type of marketing asset to generate")
    specific_offer_or_product: Optional[str] = Field(
        default=None, 
        description="Specific product, service, or promotional offer to highlight"
    )
    custom_topic: Optional[str] = Field(
        default=None, 
        description="Specific theme or custom topic (e.g., Weekend Special, Festival offer, Grand Opening)"
    )
    override_tone: Optional[str] = Field(
        default=None, 
        description="Optional tone override"
    )
    override_language: Optional[str] = Field(
        default=None, 
        description="Optional language override (English, Bengali, or Bengali-English)"
    )
    override_audience: Optional[str] = Field(
        default=None, 
        description="Optional target audience override"
    )
    additional_instructions: Optional[str] = Field(
        default=None, 
        description="Any specific constraint or call to action to include"
    )

class GenerationResponse(BaseModel):
    id: str
    profile_id: str
    content_type: str
    topic_or_offer: str
    tone: str
    language: str
    target_audience: str
    generated_content: str
    edited_content: str
    model_used: str
    factual_warnings: List[str] = []
    created_at: str

class HistoryUpdateRequest(BaseModel):
    edited_content: str = Field(..., min_length=1, description="User-edited version of the content")

class HistoryResponse(GenerationResponse):
    raw_prompt: str
    updated_at: str
