import { readSessionToken } from '../utils/session.js';

const API_BASE_URL = 'http://localhost:3000';

// Parse the next-page number out of an RFC-5988 Link header (Stage F pagination).
// The server emits `<http://.../albums?page=2&limit=6>; rel="next"` only when a next page
// exists, so a missing header (or missing rel="next") means "no more pages".
function parseNextPage(headers) {
  const linkHeader = headers.get('Link');
  if (!linkHeader) return null;

  const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
  if (!nextMatch) return null;

  const nextPage = Number(new URL(nextMatch[1]).searchParams.get('page'));
  return Number.isFinite(nextPage) ? nextPage : null;
}

export async function apiClient(path, options = {}) {
  const { method = 'GET', body, headers = {}, withPagination = false } = options;
  const token = readSessionToken();
  const apiPath = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const requestOptions = {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  };

  const response = await fetch(apiPath, requestOptions);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  // Paginated callers also need the next-page hint from the Link header. Non-paginated
  // callers (posts/todos/comments) keep getting the bare parsed body, unchanged.
  if (withPagination) {
    return { data, nextPage: parseNextPage(response.headers) };
  }

  return data;
}
