import { useState, useEffect } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import type {
  OrderCreatedPayload,
  OrderUpdatedPayload,
  OrderCancelledPayload,
  OrdersInvalidatePayload,
} from "./realtimeEvents";

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

  debouncer.queueActiveOrders();

  const order = payload?.data?.order;
  const orderId = order?.id || order?._id;
  if (orderId) {
    debouncer.queueOrder(orderId);
  }
  return true;
}

export function processOrderUpdated(
  payload: OrderUpdatedPayload,
  debouncer: RealtimeQueryDebouncer
): boolean {
  if (payload?.eventId && isEventDuplicate(payload.eventId)) return false;

  const data = payload?.data;
  const orderId = data?.orderId;
  if (orderId) {
    debouncer.queueOrder(orderId);
  }
  debouncer.queueActiveOrders();

  const stepKey = (data?.currentStepKey || "").toLowerCase();
  const state = (data?.systemState || "").toUpperCase();
  if (
    stepKey === "completed" ||
    stepKey === "cancelled" ||
    state === "COMPLETED" ||
    state === "CANCELLED"
  ) {
    debouncer.queueHistoryOrders();
  }
  return true;
}

export function processOrderCancelled(
  payload: OrderCancelledPayload,
  debouncer: RealtimeQueryDebouncer,
  notifyToast?: (message: string) => void
): boolean {
  if (payload?.eventId && isEventDuplicate(payload.eventId)) return false;

  const data = payload?.data;
  const orderId = data?.orderId;
  if (orderId) {
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
