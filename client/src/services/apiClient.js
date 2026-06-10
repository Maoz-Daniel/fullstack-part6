const API_BASE_URL = 'http://localhost:3000';

export async function apiClient(path, options = {}) {
  const { method = 'GET', body, headers = {} } = options;
  const apiPath = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const requestOptions = {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
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

  return data;
}
