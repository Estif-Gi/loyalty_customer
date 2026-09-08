/**
 * Centralized Realtime Socket.IO Events and DTO Types for Customer PWA.
 * Aligned with backend standard event envelope:
 * {
 *   eventId: string,
 *   type: string,
 *   occurredAt: string,
 *   data: T
 * }
 */

export const REALTIME_EVENTS = {
  ORDER_CREATED: "order:created",
  ORDER_UPDATED: "order:updated",
  ORDER_CANCELLED: "order:cancelled",
  ORDERS_INVALIDATE: "orders:invalidate",
} as const;

export type RealtimeEventName = (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];

/**
 * Standard backend realtime event envelope.
 */
export interface RealtimeEnvelope<T> {
  eventId?: string;
  type?: string;
  occurredAt?: string;
  data: T;
}

import type { CustomerOrder } from "@/features/orders/types";

export interface OrderCreatedData {
  order?: CustomerOrder | {
    id?: string;
    _id?: string;
    orderNumber?: string;
    orderSessionId?: string;
    customerId?: string;
    restaurantId?: string;
    tableId?: string;
    currentStepKey?: string;
    systemState?: string;
    [key: string]: unknown;
  };
}

export interface OrderUpdatedData {
  orderId: string;
  orderNumber?: string;
  previousStepKey?: string;
  currentStepKey?: string;
  systemState?: string;
  updatedAt?: string;
  order?: CustomerOrder;
}

export interface OrderCancelledData {
  orderId: string;
  orderNumber?: string;
  currentStepKey?: string;
  systemState?: string;
  reason?: string;
  cancelledAt?: string;
  order?: CustomerOrder;
}

export interface OrdersInvalidateData {
  reason?: string;
  orderSessionId?: string;
  customerId?: string;
}

export type OrderCreatedPayload = RealtimeEnvelope<OrderCreatedData>;
export type OrderUpdatedPayload = RealtimeEnvelope<OrderUpdatedData>;
export type OrderCancelledPayload = RealtimeEnvelope<OrderCancelledData>;
export type OrdersInvalidatePayload = RealtimeEnvelope<OrdersInvalidateData>;
