"""Pydantic schemas for business profiles."""
from pydantic import BaseModel, Field
from typing import Optional, List

class ProductServiceItem(BaseModel):
    name: str = Field(..., description="Name of the product or service")
    description: Optional[str] = Field(default="", description="Brief description")
    price: Optional[str] = Field(default="", description="Price or rate (e.g. $15, 250 BDT, or $50/hr)")
    offer: Optional[str] = Field(default="", description="Current discount or promotional offer if any")

class BusinessProfileBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120, description="Business name")
    category: str = Field(..., min_length=1, max_length=80, description="Business category or industry")
    description: str = Field(..., min_length=5, description="Comprehensive description of the business")
    location: str = Field(..., description="Physical address, neighborhood, or operational city")
    business_hours: str = Field(..., description="Hours of operation (e.g. Mon-Sat 9am-8pm)")
    target_audience: str = Field(..., description="Primary customer demographics and traits")
    tone: str = Field(default="Professional and Welcoming", description="Preferred tone of voice")
    language: str = Field(default="English", description="Primary marketing language (English, Bengali, Bengali-English)")
    contact_phone: Optional[str] = Field(default="", description="Customer contact phone or WhatsApp")
    contact_email: Optional[str] = Field(default="", description="Public customer email")
    website_url: Optional[str] = Field(default="", description="Website URL or social page link")
    products_services: List[ProductServiceItem] = Field(default_factory=list, description="Products and services offered")

class BusinessProfileCreate(BusinessProfileBase):
    pass

class BusinessProfileUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    business_hours: Optional[str] = None
    target_audience: Optional[str] = None
    tone: Optional[str] = None
    language: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    website_url: Optional[str] = None
    products_services: Optional[List[ProductServiceItem]] = None
    is_active: Optional[bool] = None

class BusinessProfileResponse(BusinessProfileBase):
    id: str
    is_active: bool = True
    created_at: str
    updated_at: str
