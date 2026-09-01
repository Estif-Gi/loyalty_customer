import { fetchApi } from "@/lib/api";
import type { GeoLocationCoordinates } from "../types";
import type { OrderSessionResponse, OrderSession } from "@/features/order-session/types";

export interface CreateOrderSessionParams {
  qrToken: string;
  location: GeoLocationCoordinates;
}

export const checkInApi = {
  /**
   * Submits table QR token and GPS coordinates to create or resume an active OrderSession.
   */
  createOrderSession: async (params: CreateOrderSessionParams): Promise<OrderSession> => {
    const res = await fetchApi<OrderSessionResponse>("/order-sessions", {
      method: "POST",
      body: JSON.stringify(params),
    });

    if (!res?.data?.session) {
      throw new Error("Invalid response received from order session check-in.");
    }

    return res.data.session;
  },
};
