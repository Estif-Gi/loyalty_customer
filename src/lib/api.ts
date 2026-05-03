const API_BASE_URL = import.meta.env.VITE_API_URL;
// http://localhost:5001/api

type ApiOptions = RequestInit & {
  skipAuth?: boolean;
};

export async function fetchApi(endpoint: string, options: ApiOptions = {}) {
  const { skipAuth = false, ...requestOptions } = options;
  const token = localStorage.getItem("token");
  const method = (requestOptions.method || "GET").toUpperCase();
  const headers = new Headers(requestOptions.headers || {});
  const hasBody = requestOptions.body !== undefined && requestOptions.body !== null;

  // Avoid setting JSON content-type for GET/HEAD/no-body requests to reduce CORS preflight latency.
  if (hasBody && !(requestOptions.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!skipAuth && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...requestOptions,
    method,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `API Error: ${response.status} ${response.statusText}`);
  }

  // Some successful responses (e.g. 204) have no JSON body.
  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}
