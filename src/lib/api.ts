import { ENV } from "./env";
import { ApiError, type ApiErrorResponse } from "./errors";
import { loyaltyStore } from "./store";

export type ApiOptions = RequestInit & {
  skipAuth?: boolean;
  idempotencyKey?: string;
};

/**
 * Central API Client for making authenticated HTTP requests.
 */
export async function fetchApi<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { skipAuth = false, idempotencyKey, ...requestOptions } = options;

  // Retrieve token from zustand store first, fallback to storage
  const token =
    loyaltyStore.getState().accessToken ||
    (typeof window !== "undefined"
      ? localStorage.getItem("token") || localStorage.getItem("accessToken")
      : null);

  const method = (requestOptions.method || "GET").toUpperCase();
  const headers = new Headers(requestOptions.headers || {});
  const hasBody = requestOptions.body !== undefined && requestOptions.body !== null;

  // Set JSON content-type for non-form requests with body
  if (hasBody && !(requestOptions.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Inject Bearer Auth header
  if (!skipAuth && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Inject Idempotency-Key if provided
  if (idempotencyKey) {
    headers.set("Idempotency-Key", idempotencyKey);
  }

  const url = endpoint.startsWith("http") ? endpoint : `${ENV.API_BASE_URL}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...requestOptions,
      method,
      headers,
    });
  } catch (netErr: any) {
    // Check if offline
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      throw new ApiError(0, "You are currently offline.", "OFFLINE");
    }
    throw new ApiError(
      0,
      netErr?.message || "Network error. Please check your internet connection.",
      "NETWORK_ERROR"
    );
  }

  // Handle 401 Unauthorized
  if (response.status === 401 && !skipAuth) {
    // Invalid or expired token
    const errorData: ApiErrorResponse | null = await response.json().catch(() => null);
    // Don't auto-logout if it's a specific route check, but allow clearing auth when required
    throw new ApiError(
      401,
      errorData?.message || "Session expired. Please log in again.",
      errorData?.error || "UNAUTHORIZED",
      errorData?.details
    );
  }

  // Handle other error responses
  if (!response.ok) {
    const errorData: ApiErrorResponse | null = await response.json().catch(() => null);
    const errorMessage = errorData?.message || `Request failed with status ${response.status}`;
    const errorCode = errorData?.error || "SERVER_ERROR";
    throw new ApiError(response.status, errorMessage, errorCode, errorData?.details);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const json = await response.json();
    // If backend returns standard { success: true, data: { ... } }, return that payload or unwrapped data
    return json as T;
  }

  return (await response.text()) as unknown as T;
}
