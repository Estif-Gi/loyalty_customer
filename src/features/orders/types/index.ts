import type { GeoLocationCoordinates } from "@/features/check-in/types";

export interface OrderPricing {
  subtotal: number;
  discount: number;
  tax: number;
  serviceCharge: number;
  total: number;
  currency: string;
}

export interface OrderSnapshotItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  notes?: string;
}

export interface TimelineEntry {
  stepKey: string;
  systemState: string;
  actorType: string;
  action: string;
  note?: string;
  createdAt: string;
}

export type OrderWorkflowStep = "placed" | "served" | "completed" | "cancelled";
export type OrderSystemState = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface CustomerOrder {
  id: string;
  _id?: string;
  orderNumber: string;
  restaurant: string | { _id?: string; id?: string; name?: string };
  table: string | { _id?: string; id?: string; name?: string; code?: string };
  items: OrderSnapshotItem[];
  pricing: OrderPricing;
  currentStepKey: OrderWorkflowStep | string;
  systemState: OrderSystemState | string;
  customerNotes?: string;
  timeline: TimelineEntry[];
  service?: {
    waiter?: string;
    assignedAt?: string;
    servedAt?: string | null;
  };
  payment?: {
    status: "unpaid" | "paid" | "refunded";
    method?: string;
    paidAt?: string;
  };
  cancellation?: {
    reason?: string;
    cancelledAt?: string;
  } | null;
  createdAt: string;
  updatedAt?: string;
}

export interface PlaceOrderPayload {
  orderSessionId: string;
  location: GeoLocationCoordinates;
  items: Array<{
    menuItemId: string;
    quantity: number;
    notes?: string;
  }>;
  customerNotes?: string;
}

export interface OrderResponse {
  success: boolean;
  data: {
    order: CustomerOrder;
  };
  message?: string;
}

export interface OrdersListResponse {
  success: boolean;
  data: {
    orders: CustomerOrder[];
  };
}
