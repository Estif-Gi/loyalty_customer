/**
 * Central Error Codes and Utilities aligned with loyalty-backend.
 */

export const BACKEND_ERROR_CODES = {
  // QR & Table Errors
  QR_CODE_NOT_FOUND: "QR_CODE_NOT_FOUND",
  QR_CODE_INACTIVE: "QR_CODE_INACTIVE",
  QR_CODE_REVOKED: "QR_CODE_REVOKED",
  TABLE_NOT_FOUND: "TABLE_NOT_FOUND",
  TABLE_INACTIVE: "TABLE_INACTIVE",
  TABLE_CODE_ALREADY_EXISTS: "TABLE_CODE_ALREADY_EXISTS",
  QR_TABLE_MISMATCH: "QR_TABLE_MISMATCH",
  RESTAURANT_NOT_FOUND: "RESTAURANT_NOT_FOUND",
  RESTAURANT_ORDERING_DISABLED: "RESTAURANT_ORDERING_DISABLED",
  RESTAURANT_ORDERING_LOCATION_MISSING: "RESTAURANT_ORDERING_LOCATION_MISSING",

  // Location & Geofence Errors
  INVALID_CUSTOMER_COORDINATES: "INVALID_CUSTOMER_COORDINATES",
  LOCATION_ACCURACY_TOO_LOW: "LOCATION_ACCURACY_TOO_LOW",
  OUTSIDE_RESTAURANT_ORDERING_RADIUS: "OUTSIDE_RESTAURANT_ORDERING_RADIUS",
  ORDER_LOCATION_VERIFICATION_FAILED: "ORDER_LOCATION_VERIFICATION_FAILED",

  // Session Errors
  ORDER_SESSION_NOT_FOUND: "ORDER_SESSION_NOT_FOUND",
  ORDER_SESSION_EXPIRED: "ORDER_SESSION_EXPIRED",
  ORDER_SESSION_INACTIVE: "ORDER_SESSION_INACTIVE",
  ORDER_SESSION_NOT_OWNED: "ORDER_SESSION_NOT_OWNED",
  ORDER_SESSION_INVALID: "ORDER_SESSION_INVALID",
  ORDER_SESSION_CONCURRENCY_CONFLICT: "ORDER_SESSION_CONCURRENCY_CONFLICT",

  // Ordering & Waiter Errors
  ORDER_MENU_EMPTY: "ORDER_MENU_EMPTY",
  MENU_ITEM_NOT_FOUND: "MENU_ITEM_NOT_FOUND",
  MENU_ITEM_RESTAURANT_MISMATCH: "MENU_ITEM_RESTAURANT_MISMATCH",
  INVALID_ORDER_QUANTITY: "INVALID_ORDER_QUANTITY",
  ORDER_NOT_FOUND: "ORDER_NOT_FOUND",
  ORDER_ACCESS_DENIED: "ORDER_ACCESS_DENIED",
  ORDER_STATE_CHANGED: "ORDER_STATE_CHANGED",
  TABLE_WAITER_NOT_ASSIGNED: "TABLE_WAITER_NOT_ASSIGNED",
  TABLE_WAITER_UNAVAILABLE: "TABLE_WAITER_UNAVAILABLE",
  ORDER_ASSIGNED_TO_ANOTHER_WAITER: "ORDER_ASSIGNED_TO_ANOTHER_WAITER",
  ORDER_CANCELLATION_NOT_ALLOWED: "ORDER_CANCELLATION_NOT_ALLOWED",

  // Generic
  CUSTOMER_ROLE_REQUIRED: "CUSTOMER_ROLE_REQUIRED",
  SERVER_ERROR: "SERVER_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  OFFLINE: "OFFLINE",
} as const;

export type BackendErrorCode = (typeof BACKEND_ERROR_CODES)[keyof typeof BACKEND_ERROR_CODES] | string;

export interface ApiErrorResponse {
  success?: boolean;
  error?: BackendErrorCode;
  message?: string;
  details?: Record<string, unknown>;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly errorCode: BackendErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(status: number, message: string, errorCode: BackendErrorCode = "SERVER_ERROR", details?: Record<string, unknown>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errorCode = errorCode;
    this.details = details;
  }
}

/**
 * Returns a clean, user-friendly error message based on backend error codes.
 */
export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.errorCode) {
      case BACKEND_ERROR_CODES.QR_CODE_NOT_FOUND:
        return "This QR code is not valid. Please scan the QR code displayed on your table.";
      case BACKEND_ERROR_CODES.QR_CODE_REVOKED:
      case BACKEND_ERROR_CODES.QR_CODE_INACTIVE:
        return "This table QR is currently unavailable. Please ask restaurant staff for assistance.";
      case BACKEND_ERROR_CODES.TABLE_INACTIVE:
        return "Ordering is currently unavailable for this table. Please ask staff for assistance.";
      case BACKEND_ERROR_CODES.RESTAURANT_ORDERING_DISABLED:
        return "This restaurant is not accepting table orders right now.";
      case BACKEND_ERROR_CODES.OUTSIDE_RESTAURANT_ORDERING_RADIUS:
        return "You're too far from this restaurant. Table ordering is only available while you are at the restaurant.";
      case BACKEND_ERROR_CODES.LOCATION_ACCURACY_TOO_LOW:
      case BACKEND_ERROR_CODES.ORDER_LOCATION_VERIFICATION_FAILED:
        return "Your GPS accuracy is too low to verify your presence at the restaurant. Please try moving closer to a window or opening your map app.";
      case BACKEND_ERROR_CODES.ORDER_SESSION_EXPIRED:
        return "Your table ordering session has expired. Please scan the table QR code again.";
      case BACKEND_ERROR_CODES.ORDER_SESSION_NOT_FOUND:
      case BACKEND_ERROR_CODES.ORDER_SESSION_INVALID:
        return "No active table session found. Please scan the QR code on your table to start ordering.";
      case BACKEND_ERROR_CODES.TABLE_WAITER_NOT_ASSIGNED:
        return "No waiter is currently assigned to this table. Please inform restaurant staff.";
      case BACKEND_ERROR_CODES.TABLE_WAITER_UNAVAILABLE:
        return "The assigned waiter is currently unavailable. Please ask staff to assign a waiter.";
      case BACKEND_ERROR_CODES.ORDER_MENU_EMPTY:
        return "Your cart is empty. Please add items before placing an order.";
      case BACKEND_ERROR_CODES.INVALID_ORDER_QUANTITY:
        return "Please adjust your item quantities (1–50 per item).";
      case BACKEND_ERROR_CODES.ORDER_SESSION_CONCURRENCY_CONFLICT:
        return "A session collision occurred. Please retry check-in.";
      case BACKEND_ERROR_CODES.CUSTOMER_ROLE_REQUIRED:
        return "A customer account is required to place table orders.";
      case BACKEND_ERROR_CODES.OFFLINE:
        return "You are currently offline. Please reconnect to the internet before continuing.";
      default:
        return error.message || "An unexpected error occurred. Please try again.";
    }
  }

  if (error instanceof Error) {
    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      return "Network connection issue. Please check your connection and try again.";
    }
    return error.message;
  }

  return "An unexpected error occurred.";
}
