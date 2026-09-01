import { fetchApi } from "@/lib/api";
import type { LoyaltyProgram, RestaurantLoyaltyResponse } from "../types";

export const loyaltyApi = {
  getLoyaltyByRestaurant: async (restaurantId: string): Promise<RestaurantLoyaltyResponse | null> => {
    const res = await fetchApi<any>(`/loyalty/restaurant/${restaurantId}`).catch(() => null);
    if (!res) return null;
    if (Array.isArray(res)) {
      return { programs: res as LoyaltyProgram[] };
    }
    return res as RestaurantLoyaltyResponse;
  },

  addStamps: async (params: { customerId: string; restaurantId: string; stampsToAdd: number }) => {
    return fetchApi("/users/stamps", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },
};
