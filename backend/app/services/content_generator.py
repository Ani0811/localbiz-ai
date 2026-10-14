"""Content generation orchestration and factual verification."""
import re
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple
from app.schemas.generation import GenerationRequest, GenerationResponse
from app.services.lm_studio_provider import lm_provider, LMStudioError
from app.services.prompt_builder import build_prompt_messages
from app.database import get_db

def verify_factual_accuracy(generated_text: str, profile: Dict[str, Any], req: GenerationRequest) -> List[str]:
    """Scan generated text and flag unverified claims, numbers, or prices."""
    warnings = []
    profile_text = json.dumps(profile)
    
    # 1. Check for discount percentages (e.g., 20%, 50% off)
    percentage_matches = re.findall(r'\b(\d{1,2}%\s*(?:off|discount)?)\b', generated_text, re.IGNORECASE)
    if percentage_matches:
        for pct in set(percentage_matches):
            num_part = re.search(r'\d+', pct).group()
            if num_part not in profile_text and (not req.specific_offer_or_product or num_part not in req.specific_offer_or_product):
                warnings.append(
                    f"Factual Warning: The generated copy mentions '{pct}', which is not listed in your business profile. Verify before publishing."
                )

    # 2. Check for currency figures ($xx, Rs xx, xx BDT, Tk xx)
    currency_patterns = re.findall(r'(?:[\$₹৳]|Rs\.?|Tk\.?)\s*\d+(?:\.\d{2})?', generated_text, re.IGNORECASE)
    if currency_patterns:
        for curr in set(currency_patterns):
            num_part = re.search(r'\d+', curr).group()
            if num_part not in profile_text and (not req.specific_offer_or_product or num_part not in req.specific_offer_or_product):
                warnings.append(
                    f"Factual Warning: The generated copy mentions price '{curr}', which was not found in your catalogue. Please verify."
                )

    # 3. Check for URLs or emails invented by model
    found_urls = re.findall(r'https?://[\w\.-]+(?:/\S*)?', generated_text)
    known_website = profile.get("website_url") or ""
    for url in set(found_urls):
        if url != known_website and "example.com" not in url:
            warnings.append(f"Factual Notice: Generated text includes a web address '{url}'. Check if this matches your website.")

    return warnings

async def generate_and_save_content(profile: Dict[str, Any], req: GenerationRequest) -> GenerationResponse:
    """Generate marketing copy, run factual checks, and persist to history."""
    messages = build_prompt_messages(profile, req)
    
    # Execute generation via LM Studio
    generated_content, model_used = await lm_provider.generate(
        messages=messages,
        max_tokens=1200,
        temperature=0.7
    )
    
    # Run factual verification
    warnings = verify_factual_accuracy(generated_content, profile, req)
    
    # Determine metadata
    now_iso = datetime.now(timezone.utc).isoformat()
    history_id = str(uuid.uuid4())
    topic_or_offer = req.specific_offer_or_product or req.custom_topic or profile.get("name", "General Update")
    tone = req.override_tone or profile.get("tone", "Professional and Welcoming")
    language = req.override_language or profile.get("language", "English")
    audience = req.override_audience or profile.get("target_audience", "Local Community")
    raw_prompt_str = json.dumps(messages, ensure_ascii=False)
    
    # Persist in SQLite content_history
    async with get_db() as db:
        await db.execute("""
            INSERT INTO content_history (
                id, profile_id, content_type, topic_or_offer, tone, language,
                target_audience, raw_prompt, generated_content, edited_content,
                model_used, factual_warnings, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            history_id,
            profile["id"],
            req.content_type.value,
            topic_or_offer,
            tone,
            language,
            audience,
            raw_prompt_str,
            generated_content,
            generated_content,
            model_used,
            json.dumps(warnings),
            now_iso,
            now_iso
        ))
        await db.commit()

    return GenerationResponse(
        id=history_id,
        profile_id=profile["id"],
        content_type=req.content_type.value,
        topic_or_offer=topic_or_offer,
        tone=tone,
        language=language,
        target_audience=audience,
        generated_content=generated_content,
        edited_content=generated_content,
        model_used=model_used,
        factual_warnings=warnings,
        created_at=now_iso
    )
