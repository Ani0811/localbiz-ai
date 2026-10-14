import { 
  BusinessProfile, 
  BusinessProfileCreate, 
  GenerationRequest, 
  GenerationResponse, 
  BackendHealth, 
  AIHealth 
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `API request failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson.detail) {
        if (typeof errJson.detail === 'object' && errJson.detail.message) {
          errorMsg = errJson.detail.message;
        } else if (typeof errJson.detail === 'string') {
          errorMsg = errJson.detail;
        }
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Health
  getBackendHealth: async (): Promise<BackendHealth> => {
    const res = await fetch(`${API_BASE}/api/health`, { cache: 'no-store' });
    return handleResponse<BackendHealth>(res);
  },

  getAIHealth: async (): Promise<AIHealth> => {
    const res = await fetch(`${API_BASE}/api/health/ai`, { cache: 'no-store' });
    return handleResponse<AIHealth>(res);
  },

  // Profiles
  getProfiles: async (): Promise<BusinessProfile[]> => {
    const res = await fetch(`${API_BASE}/api/profiles`, { cache: 'no-store' });
    return handleResponse<BusinessProfile[]>(res);
  },

  getProfile: async (id: string): Promise<BusinessProfile> => {
    const res = await fetch(`${API_BASE}/api/profiles/${id}`, { cache: 'no-store' });
    return handleResponse<BusinessProfile>(res);
  },

  createProfile: async (data: BusinessProfileCreate): Promise<BusinessProfile> => {
    const res = await fetch(`${API_BASE}/api/profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<BusinessProfile>(res);
  },

  updateProfile: async (id: string, data: Partial<BusinessProfileCreate>): Promise<BusinessProfile> => {
    const res = await fetch(`${API_BASE}/api/profiles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<BusinessProfile>(res);
  },

  deleteProfile: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/api/profiles/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok && res.status !== 204) {
      throw new Error(`Failed to delete profile: ${res.status}`);
    }
  },

  setActiveProfile: async (id: string): Promise<BusinessProfile> => {
    const res = await fetch(`${API_BASE}/api/profiles/${id}/active`, {
      method: 'POST',
    });
    return handleResponse<BusinessProfile>(res);
  },

  // Generation
  generateContent: async (req: GenerationRequest): Promise<GenerationResponse> => {
    const res = await fetch(`${API_BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    return handleResponse<GenerationResponse>(res);
  },

  // History
  getHistory: async (profileId?: string, contentType?: string): Promise<GenerationResponse[]> => {
    const params = new URLSearchParams();
    if (profileId) params.append('profile_id', profileId);
    if (contentType) params.append('content_type', contentType);
    const url = `${API_BASE}/api/history${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url, { cache: 'no-store' });
    return handleResponse<GenerationResponse[]>(res);
  },

  updateHistoryItem: async (id: string, editedContent: string): Promise<GenerationResponse> => {
    const res = await fetch(`${API_BASE}/api/history/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ edited_content: editedContent }),
    });
    return handleResponse<GenerationResponse>(res);
  },

  deleteHistoryItem: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/api/history/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok && res.status !== 204) {
      throw new Error(`Failed to delete history item: ${res.status}`);
    }
  },
};
