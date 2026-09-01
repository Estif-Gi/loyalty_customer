import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { restaurantApi } from "../api/restaurantApi";

export function useRestaurant(restaurantId?: string) {
  const query = useQuery({
    queryKey: queryKeys.restaurant(restaurantId),
    queryFn: () => (restaurantId ? restaurantApi.getRestaurant(restaurantId) : null),
    enabled: Boolean(restaurantId),
    staleTime: 1000 * 60 * 5,
  });

  return {
    restaurant: query.data || null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
