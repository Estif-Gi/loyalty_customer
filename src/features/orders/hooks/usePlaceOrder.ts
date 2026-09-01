import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryClient";
import { getApiErrorMessage, ApiError } from "@/lib/errors";
import { getCurrentCoordinates } from "@/features/check-in/utils/geolocation";
import { useActiveOrderSession } from "@/features/order-session/hooks/useActiveOrderSession";
import { useCartStore } from "@/features/cart/store/cartStore";
import { useCheckoutStore } from "../store/checkoutStore";
import { ordersApi } from "../api/ordersApi";
import type { CustomerOrder } from "../types";

export function usePlaceOrder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session, hasActiveSession } = useActiveOrderSession();
  const { items, customerNotes, clearCart } = useCartStore();
  const {
    idempotencyKey,
    status: checkoutStatus,
    lastError,
    getOrCreateKey,
    setSubmitting,
    setUncertain,
    setSuccess,
    reset: resetCheckout,
  } = useCheckoutStore();

  const [isCapturingLocation, setIsCapturingLocation] = useState(false);

  const placeOrder = useCallback(async (): Promise<CustomerOrder | null> => {
    // 1. Connectivity check
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      toast.error("You are offline. Please reconnect before placing your order.");
      return null;
    }

    // 2. Active session check
    if (!hasActiveSession || !session) {
      toast.error("No active table session found. Please scan your table QR to order.");
      return null;
    }

    // 3. Cart check
    if (!items || items.length === 0) {
      toast.error("Your cart is empty.");
      return null;
    }

    // 4. Double-tap guard
    if (checkoutStatus === "submitting") {
      return null;
    }

    const key = setSubmitting();

    try {
      // 5. Fresh location capture
      setIsCapturingLocation(true);
      const freshLocation = await getCurrentCoordinates({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0, // Force fresh coordinates
      });
      setIsCapturingLocation(false);

      // 6. Build payload
      const payload = {
        orderSessionId: session.id,
        location: freshLocation,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          notes: i.notes || "",
        })),
        customerNotes: customerNotes?.trim() || "",
      };

      // 7. Submit order
      const order = await ordersApi.placeOrder(payload, key);

      // 8. Order confirmed: clear checkout state, clear cart, invalidate queries
      setSuccess();
      clearCart();
      queryClient.invalidateQueries({ queryKey: queryKeys.customerOrders() });

      toast.success(`Order #${order.orderNumber} placed successfully!`);
      navigate(`/order/success/${order.id}`, { replace: true, state: { order } });
      return order;
    } catch (err: unknown) {
      setIsCapturingLocation(false);
      const errorMessage = getApiErrorMessage(err);

      // Ambiguous network failure vs deterministic business rejection
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        // Client/Business error: keep or reset as appropriate
        setUncertain(errorMessage);
      } else {
        // Network timeout / 500: keep same idempotency key for safe retry
        setUncertain(errorMessage);
      }

      toast.error(errorMessage);
      return null;
    }
  }, [
    checkoutStatus,
    clearCart,
    customerNotes,
    hasActiveSession,
    items,
    navigate,
    queryClient,
    session,
    setSubmitting,
    setSuccess,
    setUncertain,
  ]);

  return {
    placeOrder,
    isSubmitting: checkoutStatus === "submitting" || isCapturingLocation,
    isCapturingLocation,
    checkoutStatus,
    lastError,
    idempotencyKey,
    resetCheckout,
  };
}
