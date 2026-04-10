import { getAuthHeaders } from '@/lib/auth';
import { API_URL, API_ORIGIN } from '@/lib/config';

export { API_URL, API_ORIGIN };

export class ApiRequestError extends Error {
  constructor(message, payload = {}) {
    super(message);
    this.name = 'ApiRequestError';
    this.payload = payload;
  }
}

export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new ApiRequestError(data.message || 'Request failed', data);
  }

  return data;
}

export async function fetchDashboardSummary() {
  const data = await apiFetch('/dashboard/summary');
  return data.summary;
}

export async function fetchDocuments({ search = '', status = '' } = {}) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (status) params.set('status', status);
  const query = params.toString() ? `?${params.toString()}` : '';
  const data = await apiFetch(`/documents${query}`);
  return data.documents || [];
}

export async function trackDocument(query) {
  const data = await apiFetch(`/documents/track/search?q=${encodeURIComponent(query)}`);
  return {
    result: data.result,
    recent: data.recent || []
  };
}

export async function updateDocumentStatus(id, action, payload = {}) {
  return apiFetch(`/documents/${id}/${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export async function editDocumentContent(id, content) {
  return updateDocumentStatus(id, 'approve', { data: content });
}

/** Saves draft fields and sets status to pending_admin for the admin queue. */
export async function submitDocumentForReview(id, payload = {}) {
  return apiFetch(`/documents/${id}/submit-for-review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}
