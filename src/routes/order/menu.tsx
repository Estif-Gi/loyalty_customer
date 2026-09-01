import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderSessionGuard } from "@/features/order-session/components/OrderSessionGuard";
import { useActiveOrderSession } from "@/features/order-session/hooks/useActiveOrderSession";
import { useRestaurant } from "@/features/restaurant/hooks/useRestaurant";
import { useMenu } from "@/features/menu/hooks/useMenu";
import { MenuItemCard } from "@/features/menu/components/MenuItemCard";
import { CartSummaryBar } from "@/features/cart/components/CartSummaryBar";
import { useCartStore } from "@/features/cart/store/cartStore";
import { PageLoading } from "@/components/feedback/PageLoading";
import { EmptyState } from "@/components/feedback/EmptyState";
import { OfflineState } from "@/components/feedback/OfflineState";
import { cn, withOpacity } from "@/lib/utils";

function OrderMenuContent() {
  const navigate = useNavigate();
  const { session } = useActiveOrderSession();
  const restaurantId = session?.restaurant?.id || session?.restaurant?._id;

  const { restaurant } = useRestaurant(restaurantId);
  const {
    items,
    filteredItems,
    categories,
    selectedCategory,
    setSelectedCategory,
    isLoading: isMenuLoading,
  } = useMenu(restaurantId);

  const syncScope = useCartStore((state) => state.syncScope);

  useEffect(() => {
    if (session && restaurantId) {
      syncScope({
        restaurantId,
        orderSessionId: session.id,
      });
    }
  }, [restaurantId, session, syncScope]);

  if (!session) return null;

  const themeColor = restaurant?.themeColor || session.restaurant.themeColor || "#b85a2a";
  const restaurantName = restaurant?.name || session.restaurant.name || "Restaurant";
  const tableName = session.table.name || `Table ${session.table.code}`;

  return (
    <div className="min-h-dvh pb-28">
      <OfflineState />

      {/* Hero Header */}
      <div
        className="px-5 pt-6 pb-8 safe-top relative text-white transition-all"
        style={{
          background: `linear-gradient(160deg, ${themeColor} 0%, ${withOpacity(themeColor, 0.75)} 100%)`,
        }}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/home")}
            className="h-10 w-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white tap-scale"
            aria-label="Back to home"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/order/history")}
            className="bg-white/20 hover:bg-white/30 text-white rounded-full px-3.5 h-9 text-xs font-semibold backdrop-blur tap-scale flex items-center gap-1.5"
          >
            <Clock className="h-3.5 w-3.5" />
            <span>My Orders</span>
          </Button>
        </div>

        <div className="mt-5">
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <UtensilsCrossed className="h-3.5 w-3.5" />
            <span>{tableName}</span>
          </div>
          <h1 className="font-display text-4xl leading-tight font-bold">{restaurantName}</h1>
          <p className="opacity-85 text-xs mt-1">Select items to place table orders</p>
        </div>
      </div>

      {/* Category Pills */}
      {categories.length > 0 && (
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex gap-2 overflow-x-auto px-5 py-3 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "px-4 h-9 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap tap-scale transition-colors",
                selectedCategory === "all"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              All Items ({items.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-4 h-9 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap tap-scale transition-colors",
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu List */}
      <div className="px-5 pt-4 space-y-3">
        {isMenuLoading ? (
          <PageLoading message="Loading menu items..." />
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title="No Items Found"
            description="There are no items currently available in this category."
          />
        ) : (
          filteredItems.map((item) => (
            <MenuItemCard
              key={item._id}
              item={item}
              scope={{
                restaurantId: restaurantId!,
                orderSessionId: session.id,
              }}
              themeColor={themeColor}
              emoji={restaurant?.emoji}
            />
          ))
        )}
      </div>

      <CartSummaryBar />
    </div>
  );
}

export default function OrderMenuPage() {
  return (
    <OrderSessionGuard>
      <OrderMenuContent />
    </OrderSessionGuard>
  );
}
