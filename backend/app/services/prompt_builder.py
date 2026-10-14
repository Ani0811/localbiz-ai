"""Prompt construction with strict factual grounding."""
from typing import Dict, Any, List
from app.schemas.generation import GenerationRequest, ContentTypeEnum, LanguageEnum

def format_products_services(items: List[Dict[str, Any]]) -> str:
    if not items:
        return "No specific products or services catalogued."
    lines = []
    for item in items:
        name = item.get("name", "Product/Service")
        price = item.get("price")
        offer = item.get("offer")
        desc = item.get("description", "")
        details = []
        if price:
            details.append(f"Price: {price}")
        if offer:
            details.append(f"Special Offer: {offer}")
        if desc:
            details.append(f"Details: {desc}")
        details_str = f" ({', '.join(details)})" if details else ""
        lines.append(f"- {name}{details_str}")
    return "\n".join(lines)

def build_system_prompt(language: str) -> str:
    lang_instruction = {
        "English": "Write clearly in English.",
        "Bengali": "Write authentically in Bengali script (বাংলা). Ensure cultural resonance for Bengali-speaking customers.",
        "Bengali-English": "Write in a natural conversational blend of Bengali and English (Benglish/Banglish) as widely used by local Indian and Bangladeshi businesses on Instagram and WhatsApp."
    }.get(language, "Write clearly in English.")

    return f"""You are an expert local business marketing copywriter.

CRITICAL FACTUAL ACCURACY RULES:
1. Treat the provided business profile as the SOLE and ABSOLUTE source of truth.
2. NEVER invent prices, discounts, coupons, percentages, contact information, hours, addresses, or product specifications not explicitly stated in the business profile.
3. If an offer or detail is not specified in the profile, do NOT make one up. Clearly omit it or write around it naturally.
4. Language Requirement: {lang_instruction}
5. Avoid generic fluff. Be engaging, benefit-driven, and focused on compelling local customers to act.
6. Provide a ready-to-publish result without unnecessary meta-chatter or filler."""

def build_user_prompt(profile: Dict[str, Any], req: GenerationRequest) -> str:
    # Determine tone and language overrides
    tone = req.override_tone or profile.get("tone", "Professional and Welcoming")
    language = req.override_language or profile.get("language", "English")
    audience = req.override_audience or profile.get("target_audience", "Local Community")
    
    products_txt = format_products_services(profile.get("products_services", []))
    
    contact_parts = []
    if profile.get("contact_phone"):
        contact_parts.append(f"Phone/WhatsApp: {profile['contact_phone']}")
    if profile.get("contact_email"):
        contact_parts.append(f"Email: {profile['contact_email']}")
    if profile.get("website_url"):
        contact_parts.append(f"Website/Link: {profile['website_url']}")
    contact_txt = " | ".join(contact_parts) if contact_parts else "Available in-store"

    # Specific format guidelines per content type
    format_guides = {
        ContentTypeEnum.INSTAGRAM_CAPTION: """FORMAT: Instagram Caption
- Catchy opening hook line.
- 2-3 engaging body paragraphs highlighting the product/offer.
- Clear Call to Action (e.g., DM us, visit us, tap the link).
- Verified prices/offers only.
- 5-8 relevant hashtags including local tags.""",

        ContentTypeEnum.PROMO_COPY: """FORMAT: Promotional Sales Copy
- Attention-grabbing headline.
- Customer pain point or aspiration.
- Verified offer/service showcase with exact pricing/discount.
- Urgency or value statement grounded in the profile.
- Strong Call to Action.""",

        ContentTypeEnum.WHATSAPP_MESSAGE: """FORMAT: WhatsApp Broadcast / Customer Message
- Warm, direct greeting.
- Concise, scannable announcement with bullet points.
- Highlight the verified offer or product clearly.
- Contact / Ordering instructions with the exact phone/link provided.
- Keep it friendly and concise.""",

        ContentTypeEnum.GOOGLE_BUSINESS_UPDATE: """FORMAT: Google Business Profile Update
- Clear update title / headline.
- 100-150 words of local SEO-friendly copy.
- Highlight verified business hours, location, and services.
- Call to Action button suggestion (e.g., [Call Now], [Visit Us], [Learn More]).""",

        ContentTypeEnum.PRODUCT_DESCRIPTION: """FORMAT: Product / Service Catalog Description
- Enticing product title.
- Sensory, benefit-oriented description.
- Key features and exact verified price.
- Ideal customer fit and how to purchase.""",

        ContentTypeEnum.WEEKLY_CONTENT_PLAN: """FORMAT: 7-Day Weekly Content Calendar
Provide a structured 7-day schedule (Day 1 through Day 7):
For each day include:
- Day & Pillar (e.g., Day 1: Behind the Scenes, Day 2: Product Spotlight, etc.)
- Channel (Instagram, WhatsApp, Google Business, Facebook)
- Post Concept & Caption Hook
- Call to Action"""
    }

    type_guide = format_guides.get(req.content_type, "Create high-converting marketing copy.")

    extra_instructions = ""
    if req.specific_offer_or_product:
        extra_instructions += f"\nSPECIFIC FOCUS: Highlight this item or offer: {req.specific_offer_or_product}"
    if req.custom_topic:
        extra_instructions += f"\nCUSTOM THEME/EVENT: {req.custom_topic}"
    if req.additional_instructions:
        extra_instructions += f"\nADDITIONAL USER INSTRUCTIONS: {req.additional_instructions}"

    return f"""BUSINESS PROFILE:
Name: {profile.get('name')}
Category: {profile.get('category')}
Description: {profile.get('description')}
Location: {profile.get('location')}
Business Hours: {profile.get('business_hours')}
Target Audience: {audience}
Brand Tone: {tone}
Language: {language}
Contact Info: {contact_txt}

CATALOG / OFFERS:
{products_txt}
{extra_instructions}

TASK INSTRUCTIONS:
{type_guide}

Generate the final copy below:"""

def build_prompt_messages(profile: Dict[str, Any], req: GenerationRequest) -> List[Dict[str, str]]:
    language = req.override_language or profile.get("language", "English")
    system_prompt = build_system_prompt(language)
    user_prompt = build_user_prompt(profile, req)
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
