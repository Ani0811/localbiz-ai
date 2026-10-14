"""Tests for prompt construction, language selection, and factual grounding rules."""
import pytest
from app.schemas.generation import GenerationRequest, ContentTypeEnum, LanguageEnum
from app.services.prompt_builder import build_prompt_messages, build_system_prompt, format_products_services

def test_system_prompt_languages():
    en_prompt = build_system_prompt("English")
    assert "English" in en_prompt
    assert "CRITICAL FACTUAL ACCURACY RULES" in en_prompt
    assert "NEVER invent prices" in en_prompt

    bn_prompt = build_system_prompt("Bengali")
    assert "বাংলা" in bn_prompt
    assert "Bengali" in bn_prompt

    bng_prompt = build_system_prompt("Bengali-English")
    assert "Benglish" in bng_prompt

def test_prompt_messages_contains_profile_data(sample_profile_data):
    req = GenerationRequest(
        profile_id="test-id",
        content_type=ContentTypeEnum.INSTAGRAM_CAPTION,
        specific_offer_or_product="Classic Sourdough Loaf"
    )
    profile = {**sample_profile_data, "id": "test-id"}
    messages = build_prompt_messages(profile, req)
    
    assert len(messages) == 2
    system_content = messages[0]["content"]
    user_content = messages[1]["content"]

    assert "CRITICAL FACTUAL ACCURACY RULES" in system_content
    assert "Bakers Delight" in user_content
    assert "₹180" in user_content
    assert "Buy 2 get 1 butter croissant free" in user_content
    assert "14 Park Street, Kolkata" in user_content
    assert "Instagram Caption" in user_content

def test_format_products_empty():
    res = format_products_services([])
    assert "No specific products" in res
