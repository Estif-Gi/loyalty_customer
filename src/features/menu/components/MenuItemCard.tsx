import React, { useState } from "react";
import { Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/features/cart/store/cartStore";
import type { CartScope } from "@/features/cart/types";
import type { MenuItem } from "../types";
import { formatCurrency, withOpacity } from "@/lib/utils";

interface MenuItemCardProps {
  item: MenuItem;
  scope: CartScope;
  themeColor?: string;
  emoji?: string;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  scope,
  themeColor,
  emoji = "🍽️",
}) => {
  const { addItem, items } = useCartStore();
  const [justAdded, setJustAdded] = useState(false);

  const cartItem = items.find((i) => i.menuItemId === item._id);
  const currentQty = cartItem?.quantity || 0;

  const handleAdd = () => {
    addItem(scope, {
      menuItemId: item._id,
      name: item.name,
      unitPrice: item.price,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 900);
  };

  return (
    <div className="bg-card border border-border rounded-3xl p-4 shadow-soft flex items-center justify-between gap-3 transition-all hover:border-primary/40">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div
          className="h-16 w-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 shadow-inner"
          style={{
            background: themeColor
              ? withOpacity(themeColor, 0.12)
              : "hsl(18 65% 42% / 0.12)",
          }}
        >
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-full w-full object-cover rounded-2xl"
              onError={(e) => {
                // Fallback to emoji if remote URL fails
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            emoji
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-display text-lg font-bold text-foreground leading-tight truncate">
              {item.name}
            </h3>
          </div>
          <p className="font-semibold text-primary mt-0.5 text-base">
            {formatCurrency(item.price)}
          </p>
          {item.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 pl-2">
        <Button
          onClick={handleAdd}
          size="sm"
          className={`h-11 px-4 rounded-2xl font-bold tap-scale transition-all ${
            justAdded ? "bg-emerald-600 text-white" : ""
          }`}
          disabled={currentQty >= 50}
        >
          {justAdded ? (
            <Check className="h-4 w-4" />
          ) : currentQty > 0 ? (
            <span className="flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" />
              <span>{currentQty}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              <span>Add</span>
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};

export default MenuItemCard;
