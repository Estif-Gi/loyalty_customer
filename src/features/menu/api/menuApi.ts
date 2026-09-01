import { fetchApi } from "@/lib/api";
import type { Menu, MenuItem } from "../types";

export const menuApi = {
  getMenuByRestaurant: async (restaurantId: string): Promise<Menu | null> => {
    const menus = await fetchApi<Menu[]>(`/menus/restaurant/${restaurantId}`, {
      skipAuth: true,
    });

    if (Array.isArray(menus) && menus.length > 0) {
      return menus[0];
    }
    if (menus && typeof menus === "object" && "items" in menus) {
      return menus as unknown as Menu;
    }
    return null;
  },
};
