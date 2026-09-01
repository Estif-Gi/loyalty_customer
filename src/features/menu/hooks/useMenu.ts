import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { menuApi } from "../api/menuApi";
import type { MenuItem } from "../types";

export function useMenu(restaurantId?: string) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const query = useQuery({
    queryKey: queryKeys.menu(restaurantId),
    queryFn: () => (restaurantId ? menuApi.getMenuByRestaurant(restaurantId) : null),
    enabled: Boolean(restaurantId),
    staleTime: 1000 * 60 * 5,
  });

  const menu = query.data || null;
  const items: MenuItem[] = menu?.items || [];

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.category?.trim()) {
        set.add(item.category.trim());
      }
    });
    return Array.from(set);
  }, [items]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === "all") return items;
    return items.filter((item) => item.category?.trim() === selectedCategory);
  }, [items, selectedCategory]);

  return {
    menu,
    items,
    filteredItems,
    categories,
    selectedCategory,
    setSelectedCategory,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
