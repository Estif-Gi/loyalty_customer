import type { OrderSession } from "@/features/order-session/types";

export interface GeoLocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export type GeolocationErrorCode =
  | "PERMISSION_DENIED"
  | "POSITION_UNAVAILABLE"
  | "TIMEOUT"
  | "NOT_SUPPORTED";

export interface GeolocationError {
  code: GeolocationErrorCode;
  message: string;
}

export type CheckInErrorReason =
  | "missing-token"
  | "invalid-qr"
  | "revoked-qr"
  | "table-inactive"
  | "ordering-disabled"
  | "location-denied"
  | "location-unavailable"
  | "location-timeout"
  | "location-not-supported"
  | "location-accuracy-low"
  | "outside-geofence"
  | "concurrency-conflict"
  | "offline"
  | "server-error";

export interface CheckInErrorDetails {
  reason: CheckInErrorReason;
  title: string;
  message: string;
  canRetry: boolean;
  rawError?: unknown;
}

export type CheckInState =
  | { status: "idle" }
  | { status: "reading-token" }
  | { status: "needs-auth" }
  | { status: "requesting-location" }
  | { status: "validating" }
  | { status: "success"; session: OrderSession }
  | { status: "error"; error: CheckInErrorDetails };
