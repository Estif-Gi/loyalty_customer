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
    refetchInterval: status === "active" ? 1000 * 15 : false, // Poll active orders every 15s
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
      if (order && order.systemState !== "COMPLETED" && order.systemState !== "CANCELLED") {
        return 1000 * 10; // Poll active order every 10s
      }
      return false;
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
