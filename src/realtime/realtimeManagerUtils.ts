import { useState, useEffect } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import type {
  OrderCreatedPayload,
  OrderUpdatedPayload,
  OrderCancelledPayload,
  OrdersInvalidatePayload,
} from "./realtimeEvents";
import type { CustomerOrder } from "@/features/orders/types";

// In-memory deduplication set capped at 200 items (not persisted)
const MAX_SEEN_EVENTS = 200;
const seenEventIds = new Set<string>();

export function isEventDuplicate(eventId?: string): boolean {
  if (!eventId) return false;
  if (seenEventIds.has(eventId)) return true;

  if (seenEventIds.size >= MAX_SEEN_EVENTS) {
    const firstKey = seenEventIds.values().next().value;
    if (firstKey) seenEventIds.delete(firstKey);
  }
  seenEventIds.add(eventId);
  return false;
}

export function clearSeenEvents(): void {
  seenEventIds.clear();
}

/**
 * Coalesced Query Invalidation Scheduler.
 * Debounces TanStack Query invalidations (150-300ms) to avoid request storms.
 */
export class RealtimeQueryDebouncer {
  private queryClient: QueryClient;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private invalidateActive = false;
  private invalidateHistory = false;
  private specificOrderIds = new Set<string>();

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  public getQueryClient(): QueryClient {
    return this.queryClient;
  }

  public queueActiveOrders(): void {
    this.invalidateActive = true;
    this.schedule();
  }

  public queueHistoryOrders(): void {
    this.invalidateHistory = true;
    this.schedule();
  }

  public queueOrder(orderId?: string): void {
    if (orderId) {
      this.specificOrderIds.add(orderId);
    }
    this.schedule();
  }

  private schedule(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.flush();
    }, 200);
  }

  public flush(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.invalidateActive) {
      this.queryClient.invalidateQueries({ queryKey: queryKeys.customerOrders("active") });
      this.queryClient.invalidateQueries({ queryKey: queryKeys.customerOrders() });
      this.invalidateActive = false;
    }

    if (this.invalidateHistory) {
      this.queryClient.invalidateQueries({ queryKey: queryKeys.customerOrders("history") });
      this.invalidateHistory = false;
    }

    if (this.specificOrderIds.size > 0) {
      for (const orderId of this.specificOrderIds) {
        this.queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) });
      }
      this.specificOrderIds.clear();
    }
  }

  public destroy(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.specificOrderIds.clear();
  }
}

/**
 * Event Processors matching standard backend envelope:
 * {
 *   eventId: "...",
 *   type: "order:...",
 *   occurredAt: "...",
 *   data: { ... }
 * }
 */

export function processOrderCreated(
  payload: OrderCreatedPayload,
  debouncer: RealtimeQueryDebouncer
): boolean {
  if (payload?.eventId && isEventDuplicate(payload.eventId)) return false;

  const queryClient = debouncer.getQueryClient();
  const rawOrder = payload?.data?.order;
  const orderId = rawOrder?.id || (rawOrder as any)?._id;

  if (rawOrder && orderId) {
    const order = rawOrder as CustomerOrder;

    // 1. Immediately write to specific order cache
    queryClient.setQueryData<CustomerOrder>(queryKeys.order(orderId), order);

    // 2. Immediately prepend to active customer orders cache
    queryClient.setQueryData<CustomerOrder[]>(queryKeys.customerOrders("active"), (old = []) => {
      const exists = old.some((o) => (o.id || o._id) === orderId);
      if (exists) {
        return old.map((o) => ((o.id || o._id) === orderId ? { ...o, ...order } : o));
      }
      return [order, ...old];
    });

    // 3. Immediately update root customer orders cache
    queryClient.setQueryData<CustomerOrder[]>(queryKeys.customerOrders(), (old = []) => {
      const exists = old.some((o) => (o.id || o._id) === orderId);
      if (exists) {
        return old.map((o) => ((o.id || o._id) === orderId ? { ...o, ...order } : o));
      }
      return [order, ...old];
    });
  }

  // Queue background silent reconciliation as safety net
  debouncer.queueActiveOrders();
  if (orderId) {
    debouncer.queueOrder(orderId);
  }
  return true;
}

export function processOrderUpdated(
  payload: OrderUpdatedPayload,
  debouncer: RealtimeQueryDebouncer,
  notifyToast?: (message: string, type: "served" | "completed" | "preparing" | "updated") => void
): boolean {
  if (payload?.eventId && isEventDuplicate(payload.eventId)) return false;

  const queryClient = debouncer.getQueryClient();
  const data = payload?.data;
  const orderId = data?.orderId || (data?.order as any)?.id || (data?.order as any)?._id;
  const fullOrder = data?.order as CustomerOrder | undefined;

  const stepKey = (data?.currentStepKey || fullOrder?.currentStepKey || "").toLowerCase();
  const state = (data?.systemState || fullOrder?.systemState || "").toUpperCase();
  const isTerminal =
    stepKey === "completed" ||
    stepKey === "cancelled" ||
    state === "COMPLETED" ||
    state === "CANCELLED";

  if (orderId) {
    // 1. Immediately patch specific order cache
    queryClient.setQueryData<CustomerOrder>(queryKeys.order(orderId), (old) => {
      if (fullOrder) {
        return { ...(old || {}), ...fullOrder } as CustomerOrder;
      }
      if (!old) return old;
      return {
        ...old,
        currentStepKey: data?.currentStepKey || old.currentStepKey,
        systemState: data?.systemState || old.systemState,
        updatedAt: data?.updatedAt || new Date().toISOString(),
      };
    });

    // 2. Update active and history orders lists
    if (isTerminal) {
      let movedOrder: CustomerOrder | null = null;
      queryClient.setQueryData<CustomerOrder[]>(queryKeys.customerOrders("active"), (old = []) => {
        const target = old.find((o) => (o.id || o._id) === orderId);
        if (target) movedOrder = target;
        return old.filter((o) => (o.id || o._id) !== orderId);
      });

      queryClient.setQueryData<CustomerOrder[]>(queryKeys.customerOrders("history"), (old = []) => {
        const orderToInsert = fullOrder || (movedOrder ? {
          ...movedOrder,
          currentStepKey: data?.currentStepKey || (movedOrder as any).currentStepKey,
          systemState: data?.systemState || (movedOrder as any).systemState,
        } : null);

        if (!orderToInsert) return old;
        const exists = old.some((o) => (o.id || o._id) === orderId);
        if (exists) {
          return old.map((o) => ((o.id || o._id) === orderId ? { ...o, ...orderToInsert } : o));
        }
        return [orderToInsert, ...old];
      });
    } else {
      queryClient.setQueriesData<CustomerOrder[]>(
        { predicate: (query) => query.queryKey[0] === "customer-orders" },
        (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((o) => {
            const match = (o.id && o.id === orderId) || (o._id && o._id === orderId);
            if (!match) return o;
            return {
              ...o,
              ...(fullOrder || {}),
              currentStepKey: data?.currentStepKey || stepKey || o.currentStepKey,
              systemState: data?.systemState || state || o.systemState,
              service: {
                ...(o.service || {}),
                ...(fullOrder?.service || {}),
                servedAt: stepKey === "served" ? (data?.updatedAt || new Date().toISOString()) : o.service?.servedAt,
              },
              updatedAt: data?.updatedAt || o.updatedAt || new Date().toISOString(),
            };
          });
        }
      );
    }

    debouncer.queueOrder(orderId);
  }

  debouncer.queueActiveOrders();
  if (isTerminal) {
    debouncer.queueHistoryOrders();
  }

  if (notifyToast) {
    const orderNum = (data as any)?.orderNumber || fullOrder?.orderNumber;
    const prefix = orderNum ? `Order #${orderNum}` : "Your order";
    if (stepKey === "served") {
      notifyToast(`${prefix} is served!`, "served");
    } else if (stepKey === "completed" || state === "COMPLETED") {
      notifyToast(`${prefix} is completed!`, "completed");
    } else if (stepKey === "preparing" || (state === "IN_PROGRESS" && stepKey !== "served")) {
      notifyToast(`${prefix} is being prepared!`, "preparing");
    }
  }

  return true;
}

export function processOrderCancelled(
  payload: OrderCancelledPayload,
  debouncer: RealtimeQueryDebouncer,
  notifyToast?: (message: string) => void
): boolean {
  if (payload?.eventId && isEventDuplicate(payload.eventId)) return false;

  const queryClient = debouncer.getQueryClient();
  const data = payload?.data;
  const orderId = data?.orderId || (data?.order as any)?.id || (data?.order as any)?._id;
  const fullOrder = data?.order as CustomerOrder | undefined;

  if (orderId) {
    // 1. Immediately mark specific order as cancelled
    queryClient.setQueryData<CustomerOrder>(queryKeys.order(orderId), (old) => {
      if (fullOrder) return { ...(old || {}), ...fullOrder } as CustomerOrder;
      if (!old) return old;
      return {
        ...old,
        systemState: "CANCELLED",
        currentStepKey: data?.currentStepKey || "cancelled",
        cancellation: {
          reason: data?.reason || "Cancelled by staff override",
          cancelledAt: new Date().toISOString(),
        } as any,
      };
    });

    // 2. Remove from active orders and move to history
    let movedOrder: CustomerOrder | null = null;
    queryClient.setQueryData<CustomerOrder[]>(queryKeys.customerOrders("active"), (old = []) => {
      const target = old.find((o) => (o.id || o._id) === orderId);
      if (target) movedOrder = target;
      return old.filter((o) => (o.id || o._id) !== orderId);
    });

    queryClient.setQueryData<CustomerOrder[]>(queryKeys.customerOrders("history"), (old = []) => {
      const orderToInsert = fullOrder || (movedOrder ? {
        ...movedOrder,
        systemState: "CANCELLED",
        currentStepKey: "cancelled",
        cancellation: {
          reason: data?.reason || "Cancelled by staff override",
          cancelledAt: new Date().toISOString(),
        },
      } : null);

      if (!orderToInsert) return old;
      const exists = old.some((o) => (o.id || o._id) === orderId);
      if (exists) {
        return old.map((o) => ((o.id || o._id) === orderId ? { ...o, ...orderToInsert } : o));
      }
      return [orderToInsert, ...old];
    });

    debouncer.queueOrder(orderId);
  }

  debouncer.queueActiveOrders();
  debouncer.queueHistoryOrders();

  const orderRef = data?.orderNumber ? `#${data.orderNumber}` : "Order";
  if (notifyToast) {
    notifyToast(`${orderRef} was cancelled by restaurant`);
  }
  return true;
}

export function processOrdersInvalidate(
  payload: OrdersInvalidatePayload,
  debouncer: RealtimeQueryDebouncer
): boolean {
  if (payload?.eventId && isEventDuplicate(payload.eventId)) return false;

  debouncer.queueActiveOrders();
  debouncer.queueHistoryOrders();
  return true;
}

/**
 * Hook to read current realtime connection status.
 */
let realtimeConnectedListener: ((connected: boolean) => void) | null = null;
let currentRealtimeConnected = false;

export function useRealtimeStatus(): { isConnected: boolean } {
  const [isConnected, setIsConnected] = useState(currentRealtimeConnected);

  useEffect(() => {
    const listener = (status: boolean) => setIsConnected(status);
    realtimeConnectedListener = listener;
    setIsConnected(currentRealtimeConnected);
    return () => {
      if (realtimeConnectedListener === listener) {
        realtimeConnectedListener = null;
      }
    };
  }, []);

  return { isConnected };
}

export function updateRealtimeConnectionState(connected: boolean): void {
  currentRealtimeConnected = connected;
  if (realtimeConnectedListener) {
    realtimeConnectedListener(connected);
  }
}
