import { fetchApi } from "@/lib/api";
import type {
  PlaceOrderPayload,
  OrderResponse,
  OrdersListResponse,
  CustomerOrder,
} from "../types";

export const ordersApi = {
  /**
   * Places a new order or safely retries an existing submission using an Idempotency-Key.
   */
  placeOrder: async (
    payload: PlaceOrderPayload,
    idempotencyKey: string
  ): Promise<CustomerOrder> => {
    const res = await fetchApi<OrderResponse>("/orders", {
      method: "POST",
      body: JSON.stringify(payload),
      idempotencyKey,
    });

    if (!res?.data?.order) {
      throw new Error("Failed to receive confirmed order from server.");
    }

    return res.data.order;
  },

  /**
   * Fetches customer's active or past orders.
   */
  getMyOrders: async (status?: "active" | "history"): Promise<CustomerOrder[]> => {
    const query = status ? `?status=${status}` : "";
    const res = await fetchApi<OrdersListResponse>(`/orders${query}`);
    return res?.data?.orders || [];
  },

  /**
   * Fetches a specific customer order by ID.
   */
  getOrder: async (orderId: string): Promise<CustomerOrder> => {
    const res = await fetchApi<OrderResponse>(`/orders/${orderId}`);
    if (!res?.data?.order) {
      throw new Error("Order not found.");
    }
    return res.data.order;
  },
};
