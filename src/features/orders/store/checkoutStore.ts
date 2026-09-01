import { create } from "zustand";

export type CheckoutStatus = "idle" | "submitting" | "uncertain" | "success";

export interface CheckoutStoreState {
  idempotencyKey: string | null;
  status: CheckoutStatus;
  lastError: string | null;

  getOrCreateKey: () => string;
  setSubmitting: () => string;
  setUncertain: (errorMessage: string) => void;
  setSuccess: () => void;
  reset: () => void;
}

export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback RFC4122 v4 UUID generator
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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
    // Keep the same idempotency key for retry!
    set({ status: "uncertain", lastError: errorMessage });
  },

  setSuccess: () => {
    // Reset key so future order attempts generate a fresh key
    set({ idempotencyKey: null, status: "success", lastError: null });
  },

  reset: () => {
    set({ idempotencyKey: null, status: "idle", lastError: null });
  },
}));
