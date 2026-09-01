import { describe, expect, it, vi, beforeEach } from "vitest";
import { parseQR } from "@/lib/qr";
import { getApiErrorMessage, ApiError, BACKEND_ERROR_CODES } from "@/lib/errors";

describe("QR & Check-In Validation", () => {
  it("parses valid table QR URL and extracts token", () => {
    const rawUrl = "https://loyalty-customer.vercel.app/order/start?t=72182c29c8206f660660bb236ec3699ee82543f8cdd9506da438f7e961fc3a63";
    const parsed = parseQR(rawUrl);

    expect(parsed.kind).toBe("order-start");
    expect(parsed.token).toBe("72182c29c8206f660660bb236ec3699ee82543f8cdd9506da438f7e961fc3a63");
  });

  it("parses relative /order/start?t=ABC URL", () => {
    const parsed = parseQR("/order/start?t=table-token-123");
    expect(parsed.kind).toBe("order-start");
    expect(parsed.token).toBe("table-token-123");
  });

  it("handles unknown or random string QR codes", () => {
    const parsed = parseQR("random-text-12345");
    expect(parsed.kind).toBe("unknown");
    expect(parsed.token).toBeUndefined();
  });

  it("maps QR_CODE_NOT_FOUND to friendly invalid QR message", () => {
    const err = new ApiError(404, "Not Found", BACKEND_ERROR_CODES.QR_CODE_NOT_FOUND);
    const msg = getApiErrorMessage(err);
    expect(msg).toContain("This QR code is not valid");
  });

  it("maps QR_CODE_REVOKED and QR_CODE_INACTIVE to unavailable QR message", () => {
    const err = new ApiError(400, "Revoked", BACKEND_ERROR_CODES.QR_CODE_REVOKED);
    const msg = getApiErrorMessage(err);
    expect(msg).toContain("table QR is currently unavailable");
  });

  it("maps OUTSIDE_RESTAURANT_ORDERING_RADIUS to geofence error message", () => {
    const err = new ApiError(403, "Outside", BACKEND_ERROR_CODES.OUTSIDE_RESTAURANT_ORDERING_RADIUS);
    const msg = getApiErrorMessage(err);
    expect(msg).toContain("too far from this restaurant");
  });

  it("maps LOCATION_ACCURACY_TOO_LOW to accuracy error message", () => {
    const err = new ApiError(400, "Accuracy", BACKEND_ERROR_CODES.LOCATION_ACCURACY_TOO_LOW);
    const msg = getApiErrorMessage(err);
    expect(msg).toContain("GPS accuracy is too low");
  });

  it("maps TABLE_INACTIVE to inactive table message", () => {
    const err = new ApiError(400, "Inactive", BACKEND_ERROR_CODES.TABLE_INACTIVE);
    const msg = getApiErrorMessage(err);
    expect(msg).toContain("Ordering is currently unavailable for this table");
  });

  it("maps RESTAURANT_ORDERING_DISABLED to disabled ordering message", () => {
    const err = new ApiError(400, "Disabled", BACKEND_ERROR_CODES.RESTAURANT_ORDERING_DISABLED);
    const msg = getApiErrorMessage(err);
    expect(msg).toContain("restaurant is not accepting table orders");
  });
});
