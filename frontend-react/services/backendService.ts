
import { SimilarComplaint, BackendComplaintResponse, BackendSistemDurumu } from "../types";

// Config
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
const DEFAULT_TIMEOUT = 30000;
const MAX_RETRIES = 3;

interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
}

/**
 * Enhanced fetch wrapper with retry logic and timeout
 */
async function fetchWithRetry(url: string, options: RequestConfig = {}): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT, retries = MAX_RETRIES, ...fetchOptions } = options;

  let attempt = 0;

  while (attempt < retries) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });

      clearTimeout(id);

      // 503 Service Unavailable requires retry
      if (response.status === 503) {
        throw new Error("Service Unavailable");
      }

      return response;
    } catch (error: any) {
      attempt++;
      console.warn(`Fetch attempt ${attempt} failed: ${error.message}`);

      if (attempt >= retries) throw error;

      // Exponential backoff: 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
    }
  }

  throw new Error("Max retries exceeded");
}

export async function submitComplaint(text: string): Promise<BackendComplaintResponse> {
  const response = await fetchWithRetry(`${BACKEND_URL}/api/sikayet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metin: text })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Backend hatası (${response.status}): ${errorBody}`);
  }

  return await response.json();
}

export async function findSimilarComplaints(complaintId: number, limit: number = 5): Promise<SimilarComplaint[]> {
  // Backend expects 'limit' query param. 
  // It uses complaintId to find the source text automatically server-side or we pass it?
  // Looking at backend code: 
  //   @GetMapping("/complaints/{id}/similar") 
  //   uses complaint.getMaskedText() internally.

  const response = await fetchWithRetry(`${BACKEND_URL}/api/complaints/${complaintId}/similar?limit=${limit}`);

  if (!response.ok) {
    // Graceful degradation for similar complaints
    console.error("Similar complaints service unavailable");
    return [];
  }

  const data = await response.json();
  return data.similar_complaints || [];
}

export async function editComplaintResponse(complaintId: number, editedResponse: string, reason: string): Promise<any> {
  const response = await fetchWithRetry(`${BACKEND_URL}/api/complaints/${complaintId}/edit`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': 'frontend-user'
    },
    body: JSON.stringify({
      customer_reply_draft: editedResponse,
      edit_reason: reason
    })
  });

  if (!response.ok) throw new Error("Düzenleme hatası");
  return await response.json();
}

export async function approveComplaint(complaintId: number, notes?: string): Promise<void> {
  const response = await fetchWithRetry(`${BACKEND_URL}/api/complaints/${complaintId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes: notes || '' })
  });
  if (!response.ok) throw new Error("Onaylama hatası");
}

export async function rejectComplaint(complaintId: number, notes?: string): Promise<void> {
  const response = await fetchWithRetry(`${BACKEND_URL}/api/complaints/${complaintId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes: notes || '' })
  });
  if (!response.ok) throw new Error("Reddetme hatası");
}
