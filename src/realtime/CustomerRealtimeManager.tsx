import React, { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store/authStore";
import { connectSocket, disconnectSocket } from "./socket";
import {
  REALTIME_EVENTS,
  type OrderCreatedPayload,
  type OrderUpdatedPayload,
  type OrderCancelledPayload,
  type OrdersInvalidatePayload,
} from "./realtimeEvents";
import {
  RealtimeQueryDebouncer,
  processOrderCreated,
  processOrderUpdated,
  processOrderCancelled,
  processOrdersInvalidate,
  updateRealtimeConnectionState,
} from "./realtimeManagerUtils";

/**
 * Global Realtime Manager Component.
 * Mounts once inside authenticated tree to orchestrate socket lifecycle,
 * event listeners, debounced query invalidation, and background-to-foreground reconciliation.
 * Correctly reads event properties from payload.data according to backend envelope contract.
 */
export const CustomerRealtimeManager: React.FC = () => {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const debouncerRef = useRef<RealtimeQueryDebouncer | null>(null);

  if (!debouncerRef.current) {
    debouncerRef.current = new RealtimeQueryDebouncer(queryClient);
  }

  useEffect(() => {
    debouncerRef.current = new RealtimeQueryDebouncer(queryClient);
    return () => {
      debouncerRef.current?.destroy();
      debouncerRef.current = null;
    };
  }, [queryClient]);

  useEffect(() => {
    // If not authenticated, ensure socket is disconnected
    if (!isAuthenticated || !accessToken) {
      disconnectSocket();
      updateRealtimeConnectionState(false);
      return;
    }

    const socket = connectSocket(accessToken);
    if (!socket) return;

    const debouncer = debouncerRef.current!;

    // Reconcile on connect / reconnect (missed events recovery)
    const handleConnect = () => {
      updateRealtimeConnectionState(true);
      debouncer.queueActiveOrders();
      // Re-validate any currently cached orders
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "order" || query.queryKey[0] === "customer-orders",
      });
    };

    const handleDisconnect = (reason: string) => {
      updateRealtimeConnectionState(false);
      console.log("[Realtime] Socket disconnected:", reason);
    };

    // order:created -> reads order from payload.data.order
    const handleOrderCreated = (payload: OrderCreatedPayload) => {
      console.log("🆕 [Realtime] order:created received:", {
        orderId: payload?.data?.order?.id || (payload?.data?.order as any)?._id,
        orderNumber: payload?.data?.order?.orderNumber,
        step: payload?.data?.order?.currentStepKey,
        state: payload?.data?.order?.systemState,
      });
      processOrderCreated(payload, debouncer);
    };

    // order:updated -> reads orderId, currentStepKey, systemState from payload.data
    const handleOrderUpdated = (payload: OrderUpdatedPayload) => {
      console.log("🔔 [Realtime] order:updated received:", {
        orderId: payload?.data?.orderId || payload?.data?.order?.id || (payload?.data?.order as any)?._id,
        orderNumber: (payload?.data as any)?.orderNumber || payload?.data?.order?.orderNumber,
        currentStepKey: payload?.data?.currentStepKey || payload?.data?.order?.currentStepKey,
        systemState: payload?.data?.systemState || payload?.data?.order?.systemState,
        servedAt: payload?.data?.order?.service?.servedAt,
      });
      processOrderUpdated(payload, debouncer, (msg, type) => {
        if (type === "served") {
          toast.success("Order Served! 🍽️", {
            description: "Your food has arrived at your table. Enjoy your meal!",
          });
        } else if (type === "completed") {
          toast.success("Order Completed! ✨", {
            description: "Thank you for dining with us.",
          });
        } else if (type === "preparing") {
          toast.info("Preparing Your Order 🍳", {
            description: "The kitchen is actively preparing your food.",
          });
        } else {
          toast.info(msg);
        }
      });
    };

    // order:cancelled -> reads orderId, orderNumber from payload.data
    const handleOrderCancelled = (payload: OrderCancelledPayload) => {
      console.log("❌ [Realtime] order:cancelled received:", {
        orderId: payload?.data?.orderId || payload?.data?.order?.id,
        reason: payload?.data?.reason,
      });
      processOrderCancelled(payload, debouncer, (msg) => toast.info(msg));
    };

    // orders:invalidate
    const handleOrdersInvalidate = (payload: OrdersInvalidatePayload) => {
      processOrdersInvalidate(payload, debouncer);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on(REALTIME_EVENTS.ORDER_CREATED, handleOrderCreated);
    socket.on(REALTIME_EVENTS.ORDER_UPDATED, handleOrderUpdated);
    socket.on(REALTIME_EVENTS.ORDER_CANCELLED, handleOrderCancelled);
    socket.on(REALTIME_EVENTS.ORDERS_INVALIDATE, handleOrdersInvalidate);

    // Initial state check if already connected
    if (socket.connected) {
      handleConnect();
    }

    // Page Visibility and Online/Focus recovery
    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        debouncer.queueActiveOrders();
        queryClient.invalidateQueries({
          predicate: (query) =>
            query.queryKey[0] === "order" ||
            query.queryKey[0] === "customer-orders" ||
            query.queryKey[0] === "active-order-session",
        });
      }
    };

    const handleWindowFocus = () => {
      debouncer.queueActiveOrders();
    };

    const handleOnline = () => {
      debouncer.queueActiveOrders();
      if (!socket.connected) {
        socket.connect();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("online", handleOnline);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off(REALTIME_EVENTS.ORDER_CREATED, handleOrderCreated);
      socket.off(REALTIME_EVENTS.ORDER_UPDATED, handleOrderUpdated);
      socket.off(REALTIME_EVENTS.ORDER_CANCELLED, handleOrderCancelled);
      socket.off(REALTIME_EVENTS.ORDERS_INVALIDATE, handleOrdersInvalidate);

      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("online", handleOnline);
    };
  }, [accessToken, isAuthenticated, queryClient]);

  return null;
};

export default CustomerRealtimeManager;
