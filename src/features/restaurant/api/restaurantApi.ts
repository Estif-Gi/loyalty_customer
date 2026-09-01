import { fetchApi } from "@/lib/api";
import type { Restaurant } from "../types";

export const restaurantApi = {
  getRestaurant: async (restaurantId: string): Promise<Restaurant> => {
    return fetchApi<Restaurant>(`/restaurants/${restaurantId}`, { skipAuth: true });
  },

  getAllRestaurants: async (): Promise<Restaurant[]> => {
    return fetchApi<Restaurant[]>("/restaurants", { skipAuth: true });
  },
};
