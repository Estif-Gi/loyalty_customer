import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3, // 3 minutes default
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 400, 401, 403, 404
        if (error?.status && [400, 401, 403, 404].includes(error.status)) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

/**
 * Centralized Query Keys Factory
 */
export const queryKeys = {
  activeOrderSession: () => ["active-order-session"] as const,
  restaurant: (restaurantId?: string) => ["restaurant", restaurantId] as const,
  menu: (restaurantId?: string) => ["menu", restaurantId] as const,
  customerOrders: (status?: "active" | "history") => ["customer-orders", status] as const,
  order: (orderId?: string) => ["order", orderId] as const,
  profile: () => ["profile"] as const,
  loyalty: (restaurantId?: string) => ["loyalty", restaurantId] as const,
  rewardsByLoyalty: (keys: string[]) => ["rewards-by-loyalty", keys] as const,
};
