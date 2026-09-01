import React from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useCartStore } from "../store/cartStore";
import { formatCurrency } from "@/lib/utils";

export const CartSummaryBar: React.FC = () => {
  const navigate = useNavigate();
  const itemCount = useCartStore((state) => state.getItemCount());
  const subtotal = useCartStore((state) => state.getEstimatedSubtotal());

  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 p-4 safe-bottom pointer-events-none animate-slide-up">
      <div className="max-w-md mx-auto pointer-events-auto">
        <button
          onClick={() => navigate("/order/cart")}
          className="w-full bg-primary text-primary-foreground h-16 rounded-3xl px-5 shadow-glow flex items-center justify-between tap-scale font-semibold transition-transform active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-xs uppercase tracking-wider opacity-85">
                {itemCount} {itemCount === 1 ? "Item" : "Items"}
              </p>
              <p className="text-lg leading-tight font-bold">{formatCurrency(subtotal)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-2xl text-sm">
            <span>View Cart</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </button>
      </div>
    </div>
  );
};

export default CartSummaryBar;
