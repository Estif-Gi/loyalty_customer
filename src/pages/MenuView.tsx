import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, withOpacity, formatCurrency } from "@/lib/utils";
import { loyaltyStore } from "@/lib/store";

export default function MenuView() {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  
  // Use user from store to optionally fallback on resName or id
  const user = loyaltyStore((state) => state.user);

  // Get the id from params, localstorage or zustand
  const id = paramId || localStorage.getItem("restaurantId") || (user as any)?.currentRestaurantId || undefined;
  console.log(id);
  const { data: fetchedRestaurant, isLoading: isResLoading } = useQuery({
    queryKey: ["restaurant", id],
    queryFn: () => fetchApi(`/restaurants/${id}`, { skipAuth: true }),
    enabled: !!id,
  });

  const { data: menu, isLoading: isMenuLoading } = useQuery({
    queryKey: ["menu", id],
    queryFn: () => fetchApi(`/menus/restaurant/${id}`, { skipAuth: true }).catch(() => null),
    enabled: !!id,
  });

  const [activeCat, setActiveCat] = useState("all");

  // Fallback to local user data if restaurant API is loading/failing
  const loyalRestaurant = (user as any)?.loyalTo?.find((l: any) => l.resID === id);
  const restaurant = fetchedRestaurant || (loyalRestaurant ? {
    name: loyalRestaurant.resName,
    emoji: "🍽️",
    themeColor: "",
  } : null);

  if ((isResLoading && !restaurant) || isMenuLoading) {
    return <div className="p-5 safe-top flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!restaurant) {
    return (
      <div className="p-6 text-center">
        <p>Menu not found.</p>
        <Button onClick={() => navigate(-1)} className="mt-4">Back</Button>
      </div>
    );
  }

  const menuData = Array.isArray(menu) ? menu[0] : menu;
  const items = menuData?.items || [];
  
  // Try to extract categories if they exist on items, otherwise put everything in "All"
  const categoriesMap = new Map();
  categoriesMap.set("all", { id: "all", name: "All", items: [] });
  
  items.forEach((item: any) => {
    categoriesMap.get("all").items.push(item);
    if (item.category) {
      if (!categoriesMap.has(item.category)) {
        categoriesMap.set(item.category, { id: item.category, name: item.category, items: [] });
      }
      categoriesMap.get(item.category).items.push(item);
    }
  });

  const categories = Array.from(categoriesMap.values()).filter(c => c.items.length > 0);
  const category = categoriesMap.get(activeCat) || categoriesMap.get("all");

  return (
    <div className="pb-4">
      <div
        className="px-5 pt-6 pb-8 safe-top relative"
        style={{
          background: restaurant.themeColor
            ? `linear-gradient(160deg, ${restaurant.themeColor} 0%, ${withOpacity(restaurant.themeColor, 0.7)} 100%)`
            : `linear-gradient(160deg, #184565 0%, #184565b3 100%)`,
        }}
      >
        <button onClick={() => navigate(-1)} className="h-10 w-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white tap-scale">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="mt-6 text-white">
          <p className="opacity-80 text-sm uppercase tracking-wider">Menu</p>
          <h1 className="font-display text-4xl mt-1 leading-none">{restaurant.name}</h1>
        </div>
      </div>

      {/* Tabs */}
      {categories.length > 1 && (
        <div className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-border">
          <div className="flex gap-2 overflow-x-auto px-5 py-3 scrollbar-hide">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={cn(
                  "px-4 h-9 rounded-full text-sm font-semibold whitespace-nowrap tap-scale transition-colors",
                  activeCat === c.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-5 pt-4 space-y-3">
        {category?.items.length === 0 ? (
          <p className="text-muted-foreground text-center">No menu items found.</p>
        ) : (
          category?.items.map((item: any) => (
            <div key={item._id || item.name} className="bg-card border border-border rounded-3xl p-4 shadow-soft flex items-start gap-3">
              <div
                className="h-16 w-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                style={{ background: restaurant.themeColor ? withOpacity(restaurant.themeColor, 0.12) : `hsl(18 65% 42% / 0.12)` }}
              >
                {restaurant.emoji || "🍽️"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-display text-lg leading-tight">{item.name}</p>
                  <p className="font-semibold text-primary">{formatCurrency(item.price)}</p>
                </div>
                {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
