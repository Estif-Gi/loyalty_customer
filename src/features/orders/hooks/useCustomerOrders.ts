import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ordersApi } from "../api/ordersApi";
import type { CustomerOrder } from "../types";

export function useCustomerOrders(status?: "active" | "history") {
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery<CustomerOrder[]>({
    queryKey: queryKeys.customerOrders(status),
    queryFn: () => ordersApi.getMyOrders(status),
    enabled: isInitialized && isAuthenticated,
    // Socket.IO provides instant updates; 30-second fallback serves as safety net
    refetchInterval: status === "active" ? 1000 * 30 : false,
  });

  return {
    orders: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCustomerOrder(orderId?: string) {
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery<CustomerOrder | null>({
    queryKey: queryKeys.order(orderId),
    queryFn: () => (orderId ? ordersApi.getOrder(orderId) : null),
    enabled: isInitialized && isAuthenticated && Boolean(orderId),
    refetchInterval: (q) => {
      const order = q.state.data;
      // If not yet loaded, use 30s fallback
      if (!order) return 1000 * 30;

      const stepKey = (order.currentStepKey || "").toLowerCase();
      const isFinished =
        order.systemState === "COMPLETED" ||
        order.systemState === "CANCELLED" ||
        stepKey === "completed" ||
        stepKey === "cancelled";

      if (isFinished) {
        return false; // Completed/cancelled orders do not poll
      }
      return 1000 * 30; // 30s fallback polling for active order
    },
  });

  return {
    order: query.data || null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
