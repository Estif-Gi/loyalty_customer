import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { loyaltyApi } from "../api/loyaltyApi";
import type { RestaurantLoyaltyResponse } from "../types";

export function useLoyalty(restaurantId?: string) {
  const query = useQuery<RestaurantLoyaltyResponse | null>({
    queryKey: queryKeys.loyalty(restaurantId),
    queryFn: () => (restaurantId ? loyaltyApi.getLoyaltyByRestaurant(restaurantId) : null),
    enabled: Boolean(restaurantId),
    staleTime: 1000 * 60 * 5,
  });

  return {
    loyalty: query.data || null,
    programs: query.data?.programs || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
