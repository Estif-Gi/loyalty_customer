import { fetchApi } from "@/lib/api";
import type { GeoLocationCoordinates } from "@/features/check-in/types";
import type {
  OrderSession,
  OrderSessionResponse,
  VerifyLocationResponse,
} from "../types";

export const orderSessionApi = {
  /**
   * Retrieves the current authenticated customer's active non-expired session.
   */
  getCurrentSession: async (): Promise<OrderSession | null> => {
    try {
      const res = await fetchApi<OrderSessionResponse>("/order-sessions/current");
      return res?.data?.session || null;
    } catch (err: any) {
      if (err?.status === 404) {
        return null;
      }
      throw err;
    }
  },

  /**
   * Re-verifies GPS presence before sensitive checkout if needed.
   */
  verifyLocation: async (
    sessionId: string,
    location: GeoLocationCoordinates
  ): Promise<VerifyLocationResponse["data"]> => {
    const res = await fetchApi<VerifyLocationResponse>(
      `/order-sessions/${sessionId}/verify-location`,
      {
        method: "POST",
        body: JSON.stringify(location),
      }
    );
    return res.data;
  },

  /**
   * Cancels the active session.
   */
  cancelSession: async (sessionId: string): Promise<void> => {
    await fetchApi(`/order-sessions/${sessionId}/cancel`, {
      method: "POST",
    });
  },
};
