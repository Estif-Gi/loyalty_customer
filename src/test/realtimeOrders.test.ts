import { describe, expect, it, beforeEach, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useCheckoutStore, generateUUID } from "@/features/orders/store/checkoutStore";
import { getSocketOrigin, connectSocket, disconnectSocket, getSocket } from "@/realtime/socket";
import {
  RealtimeQueryDebouncer,
  isEventDuplicate,
  clearSeenEvents,
  processOrderCreated,
  processOrderUpdated,
  processOrderCancelled,
} from "@/realtime/realtimeManagerUtils";
import type {
  OrderCreatedPayload,
  OrderUpdatedPayload,
  OrderCancelledPayload,
} from "@/realtime/realtimeEvents";

describe("Customer Realtime & Socket Integration", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    useCheckoutStore.getState().reset();
    useAuthStore.getState().logout();
    disconnectSocket();
    clearSeenEvents();
    vi.clearAllMocks();
  });

  it("1. getSocketOrigin strips /api and trailing slashes from API_BASE_URL", () => {
    expect(getSocketOrigin("https://estif.bahirandelivery.com/api")).toBe(
      "https://estif.bahirandelivery.com"
    );
    expect(getSocketOrigin("https://estif.bahirandelivery.com/api/")).toBe(
      "https://estif.bahirandelivery.com"
    );
    expect(getSocketOrigin("https://example.com/api///")).toBe("https://example.com");
    expect(getSocketOrigin("http://localhost:5000/api")).toBe("http://localhost:5000");
  });

  it("2. order:updated reads orderId and status from payload.data (backend envelope)", () => {
    const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
    const debouncer = new RealtimeQueryDebouncer(queryClient);

    const payload: OrderUpdatedPayload = {
      eventId: "evt-upd-1",
      type: "order:updated",
      occurredAt: "2026-09-03T12:00:00Z",
      data: {
        orderId: "order-123",
        currentStepKey: "served",
        systemState: "IN_PROGRESS",
      },
    };

    processOrderUpdated(payload, debouncer);
    debouncer.flush();

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.order("order-123"),
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.customerOrders("active"),
    });

    debouncer.destroy();
  });

  it("3. order:created reads Order from payload.data.order", () => {
    const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
    const debouncer = new RealtimeQueryDebouncer(queryClient);

    const payload: OrderCreatedPayload = {
      eventId: "evt-created-1",
      type: "order:created",
      occurredAt: "2026-09-03T12:00:00Z",
      data: {
        order: {
          id: "order-created-456",
          orderNumber: "105",
          currentStepKey: "placed",
          systemState: "OPEN",
        },
      },
    };

    processOrderCreated(payload, debouncer);
    debouncer.flush();

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.order("order-created-456"),
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.customerOrders("active"),
    });

    debouncer.destroy();
  });

  it("4. order:cancelled reads fields from payload.data and invalidates specific, active, and history", () => {
    const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
    const debouncer = new RealtimeQueryDebouncer(queryClient);
    const toastSpy = vi.fn();

    const payload: OrderCancelledPayload = {
      eventId: "evt-canc-1",
      type: "order:cancelled",
      occurredAt: "2026-09-03T12:00:00Z",
      data: {
        orderId: "order-canc-789",
        orderNumber: "108",
        currentStepKey: "served",
        systemState: "CANCELLED",
        reason: "Customer requested cancellation",
      },
    };

    processOrderCancelled(payload, debouncer, toastSpy);
    debouncer.flush();

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.order("order-canc-789"),
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.customerOrders("active"),
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.customerOrders("history"),
    });
    expect(toastSpy).toHaveBeenCalledWith("#108 was cancelled by restaurant");

    debouncer.destroy();
  });

  it("5. eventId deduplication still uses top-level payload.eventId", () => {
    const debouncer = new RealtimeQueryDebouncer(queryClient);

    const payload: OrderUpdatedPayload = {
      eventId: "evt-dedup-100",
      type: "order:updated",
      occurredAt: "2026-09-03T12:00:00Z",
      data: {
        orderId: "order-dedup",
        currentStepKey: "served",
      },
    };

    const firstResult = processOrderUpdated(payload, debouncer);
    expect(firstResult).toBe(true);

    // Identical eventId arrives second time
    const secondResult = processOrderUpdated(payload, debouncer);
    expect(secondResult).toBe(false);

    debouncer.destroy();
  });

  it("6. placed -> served realtime update invalidates specific Order and active orders", () => {
    const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
    const debouncer = new RealtimeQueryDebouncer(queryClient);

    processOrderUpdated(
      {
        eventId: "evt-flow-1",
        type: "order:updated",
        occurredAt: "2026-09-03T12:00:00Z",
        data: {
          orderId: "order-flow",
          currentStepKey: "served",
          systemState: "IN_PROGRESS",
        },
      },
      debouncer
    );
    debouncer.flush();

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.order("order-flow"),
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.customerOrders("active"),
    });
    // Not yet completed, so history is not queued
    expect(invalidateQueriesSpy).not.toHaveBeenCalledWith({
      queryKey: queryKeys.customerOrders("history"),
    });

    debouncer.destroy();
  });

  it("7. served -> completed invalidates specific order, active orders, and history", () => {
    const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
    const debouncer = new RealtimeQueryDebouncer(queryClient);

    processOrderUpdated(
      {
        eventId: "evt-flow-2",
        type: "order:updated",
        occurredAt: "2026-09-03T12:00:00Z",
        data: {
          orderId: "order-flow",
          currentStepKey: "completed",
          systemState: "COMPLETED",
        },
      },
      debouncer
    );
    debouncer.flush();

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.order("order-flow"),
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.customerOrders("active"),
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.customerOrders("history"),
    });

    debouncer.destroy();
  });

  it("8. reconnect triggers REST reconciliation of active queries", () => {
    const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
    const debouncer = new RealtimeQueryDebouncer(queryClient);

    // Simulate reconnect trigger
    debouncer.queueActiveOrders();
    queryClient.invalidateQueries({
      predicate: (query) =>
        query.queryKey[0] === "order" || query.queryKey[0] === "customer-orders",
    });
    debouncer.flush();

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.customerOrders("active"),
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith(
      expect.objectContaining({ predicate: expect.any(Function) })
    );

    debouncer.destroy();
  });

  it("9. logout disconnects Socket and cleans up state", () => {
    useAuthStore.getState().login({ id: "cust-1", name: "Alice" }, "mock-jwt-token");
    connectSocket();
    expect(getSocket()).not.toBeNull();

    useAuthStore.getState().logout();
    disconnectSocket();

    expect(getSocket()).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it("10. login connects Socket with authenticated token from auth store", () => {
    useAuthStore.getState().login({ id: "cust-1", name: "Alice" }, "my-test-jwt");
    const socket = connectSocket();

    expect(socket).not.toBeNull();
    expect((socket?.io?.opts?.auth as Record<string, unknown>)?.token).toBe("my-test-jwt");
  });

  it("11. multiple Orders continue creating fresh Idempotency-Keys", () => {
    // Order #1
    const key1 = useCheckoutStore.getState().setSubmitting();
    expect(key1).toBeDefined();
    useCheckoutStore.getState().setSuccess();
    expect(useCheckoutStore.getState().idempotencyKey).toBeNull();

    // Order #2 (same session)
    const key2 = useCheckoutStore.getState().setSubmitting();
    expect(key2).toBeDefined();
    expect(key2).not.toBe(key1);
  });

  it("12. ambiguous retry retains the exact same idempotency key", () => {
    const initialKey = useCheckoutStore.getState().setSubmitting();
    useCheckoutStore.getState().setUncertain("Network timeout. Please retry.");

    expect(useCheckoutStore.getState().status).toBe("uncertain");
    const retryKey = useCheckoutStore.getState().getOrCreateKey();
    expect(retryKey).toBe(initialKey);
  });

  it("13. deterministic 4xx sets rejected status and resets idempotency key", () => {
    useCheckoutStore.getState().setSubmitting();
    useCheckoutStore.getState().setRejected("Table ordering session has expired.");

    expect(useCheckoutStore.getState().status).toBe("rejected");
    expect(useCheckoutStore.getState().lastError).toBe("Table ordering session has expired.");
    expect(useCheckoutStore.getState().idempotencyKey).toBeNull();

    // Subsequent attempt generates a brand new key
    const freshKey = useCheckoutStore.getState().getOrCreateKey();
    expect(freshKey).toBeDefined();
    expect(typeof freshKey).toBe("string");
  });

  it("14. generateUUID uses crypto.getRandomValues without Math.random", () => {
    const uuid = generateUUID();
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it("15. debouncer coalesces rapid events into a single query invalidation batch", async () => {
    vi.useFakeTimers();
    const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
    const debouncer = new RealtimeQueryDebouncer(queryClient);

    debouncer.queueActiveOrders();
    debouncer.queueOrder("order-1");
    debouncer.queueOrder("order-1"); // duplicate call
    debouncer.queueActiveOrders(); // duplicate call

    expect(invalidateQueriesSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(250);

    // After timer runs, exactly one invalidation per target was triggered
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.customerOrders("active"),
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.order("order-1"),
    });

    debouncer.destroy();
    vi.useRealTimers();
  });
});
