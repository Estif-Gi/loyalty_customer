import { create } from "zustand";

export type CheckoutStatus = "idle" | "submitting" | "uncertain" | "rejected" | "success";

export interface CheckoutStoreState {
  idempotencyKey: string | null;
  status: CheckoutStatus;
  lastError: string | null;

  getOrCreateKey: () => string;
  setSubmitting: () => string;
  setUncertain: (errorMessage: string) => void;
  setRejected: (errorMessage: string) => void;
  setSuccess: () => void;
  reset: () => void;
}

/**
 * Generates a cryptographically strong RFC4122 v4 UUID.
 * Uses crypto.randomUUID where available, falling back to crypto.getRandomValues.
 * Never uses Math.random for idempotency identifiers.
 */
export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    // Set version (4) and variant (RFC4122)
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  throw new Error("Cryptographic random values not supported in this environment");
}

export const useCheckoutStore = create<CheckoutStoreState>((set, get) => ({
  idempotencyKey: null,
  status: "idle",
  lastError: null,

  getOrCreateKey: () => {
    const existing = get().idempotencyKey;
    if (existing) return existing;
    const newKey = generateUUID();
    set({ idempotencyKey: newKey });
    return newKey;
  },

  setSubmitting: () => {
    const key = get().getOrCreateKey();
    set({ status: "submitting", lastError: null });
    return key;
  },

  setUncertain: (errorMessage: string) => {
    // Keep the same idempotency key for safe retry on ambiguous network failures
    set({ status: "uncertain", lastError: errorMessage });
  },

  setRejected: (errorMessage: string) => {
    // Deterministic rejection from backend: request reached server and failed business rules.
    // Reset the key so any subsequent fix/submission generates a fresh idempotency key.
    set({ idempotencyKey: null, status: "rejected", lastError: errorMessage });
  },

  setSuccess: () => {
    // Reset key so future order attempts generate a fresh key
    set({ idempotencyKey: null, status: "success", lastError: null });
  },

  reset: () => {
    set({ idempotencyKey: null, status: "idle", lastError: null });
  },
}));
