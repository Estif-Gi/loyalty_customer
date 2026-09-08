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
   * Fetches customer's active or past orders via /orders/history.
   */
  getMyOrders: async (
    status?: "active" | "history",
    page: number = 1,
    limit: number = 10
  ): Promise<CustomerOrder[]> => {
    const params = new URLSearchParams();
    if (page != null) params.set("page", String(page));
    if (limit != null) params.set("limit", String(limit));
    if (status) params.set("status", status);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const res = await fetchApi<any>(`/orders/history${queryString}`);

    const rawOrders: any[] = Array.isArray(res?.data?.orders)
      ? res.data.orders
      : Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.orders)
      ? res.orders
      : Array.isArray(res)
      ? res
      : [];

    return rawOrders.map((order) => ({
      ...order,
      id: order.id || order._id || "",
    }));
  },

  /**
   * Dedicated helper for fetching customer order history.
   */
  getOrderHistory: async (page: number = 1, limit: number = 10): Promise<CustomerOrder[]> => {
    return ordersApi.getMyOrders("history", page, limit);
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
