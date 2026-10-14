export interface ProductServiceItem {
  name: string;
  description?: string;
  price?: string;
  offer?: string;
}

export interface BusinessProfile {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  business_hours: string;
  target_audience: string;
  tone: string;
  language: string;
  contact_phone?: string;
  contact_email?: string;
  website_url?: string;
  products_services: ProductServiceItem[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessProfileCreate {
  name: string;
  category: string;
  description: string;
  location: string;
  business_hours: string;
  target_audience: string;
  tone: string;
  language: string;
  contact_phone?: string;
  contact_email?: string;
  website_url?: string;
  products_services: ProductServiceItem[];
}

export type ContentType = 
  | 'instagram_caption'
  | 'promo_copy'
  | 'whatsapp_message'
  | 'google_business_update'
  | 'product_description'
  | 'weekly_content_plan';

export interface GenerationRequest {
  profile_id: string;
  content_type: ContentType;
  specific_offer_or_product?: string;
  custom_topic?: string;
  override_tone?: string;
  override_language?: string;
  override_audience?: string;
  additional_instructions?: string;
}

export interface GenerationResponse {
  id: string;
  profile_id: string;
  content_type: ContentType;
  topic_or_offer: string;
  tone: string;
  language: string;
  target_audience: string;
  generated_content: string;
  edited_content: string;
  model_used: string;
  factual_warnings: string[];
  created_at: string;
  raw_prompt?: string;
  updated_at?: string;
}

export interface BackendHealth {
  status: string;
  database: string;
  app_version: string;
  active_profile_count: number;
}

export interface AIHealth {
  status: 'connected' | 'unreachable' | 'model_loaded' | 'no_model_loaded';
  base_url: string;
  configured_model: string;
  is_reachable: boolean;
  is_model_loaded: boolean;
  loaded_models: string[];
  available_models: string[];
  setup_instructions: string[];
  error_detail?: string | null;
}
