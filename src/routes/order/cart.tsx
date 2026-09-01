import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Sparkles, AlertCircle, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { OrderSessionGuard } from "@/features/order-session/components/OrderSessionGuard";
import { useActiveOrderSession } from "@/features/order-session/hooks/useActiveOrderSession";
import { useCartStore } from "@/features/cart/store/cartStore";
import { CartItemRow } from "@/features/cart/components/CartItemRow";
import { usePlaceOrder } from "@/features/orders/hooks/usePlaceOrder";
import { EmptyState } from "@/components/feedback/EmptyState";
import { OfflineState } from "@/components/feedback/OfflineState";
import { formatCurrency } from "@/lib/utils";

function CartPageContent() {
  const navigate = useNavigate();
  const { session } = useActiveOrderSession();
  const { items, customerNotes, setCustomerNotes, clearCart, getEstimatedSubtotal } = useCartStore();
  const {
    placeOrder,
    isSubmitting,
    isCapturingLocation,
    checkoutStatus,
    lastError,
  } = usePlaceOrder();

  const estimatedSubtotal = getEstimatedSubtotal();
  const isEmpty = items.length === 0;

  if (isEmpty) {
    return (
      <div className="min-h-dvh flex flex-col safe-top px-5 pt-6">
        <button
          onClick={() => navigate("/order/menu")}
          className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-foreground tap-scale mb-4"
          aria-label="Back to menu"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <EmptyState
          imageSrc="/images/ordering/empty-cart.svg"
          title="Your Cart is Empty"
          description="Add delicious items from the restaurant menu to place your table order."
          actionLabel="Browse Menu"
          onAction={() => navigate("/order/menu")}
        />
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-36 px-5 pt-6 safe-top">
      <OfflineState />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/order/menu")}
            className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-foreground tap-scale"
            aria-label="Back to menu"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-3xl font-bold leading-tight">Your Order</h1>
            <p className="text-xs text-muted-foreground">
              {session?.table.name || "Table Order"} · {session?.restaurant.name}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={clearCart}
          className="text-xs text-destructive hover:bg-destructive/10 rounded-xl"
        >
          Clear
        </Button>
      </div>

      {/* Items List */}
      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <CartItemRow key={item.menuItemId} item={item} />
        ))}
      </div>

      {/* Special Instructions */}
      <div className="bg-card border border-border rounded-3xl p-4 shadow-soft mb-6">
        <label htmlFor="notes" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Special Instructions for Kitchen / Waiter
        </label>
        <Textarea
          id="notes"
          placeholder="e.g. Please bring drinks first, extra napkins, allergies..."
          value={customerNotes}
          onChange={(e) => setCustomerNotes(e.target.value)}
          className="rounded-2xl resize-none text-sm border-border/80"
          rows={3}
          maxLength={300}
        />
      </div>

      {/* Price Summary */}
      <div className="bg-card border border-border rounded-3xl p-5 shadow-soft mb-6 space-y-2.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Estimated Subtotal</span>
          <span className="font-semibold text-foreground">{formatCurrency(estimatedSubtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Service & Taxes</span>
          <span className="text-xs text-muted-foreground">Calculated by server</span>
        </div>
        <div className="pt-2.5 border-t border-border/60 flex items-center justify-between">
          <span className="font-display text-lg font-bold text-foreground">Estimated Total</span>
          <span className="font-display text-2xl font-bold text-primary">
            {formatCurrency(estimatedSubtotal)}
          </span>
        </div>

        <div className="pt-2 flex items-start gap-2 text-[11px] text-muted-foreground leading-snug">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-amber-500 mt-0.5" />
          <span>Server pricing is authoritative. Exact totals and discounts will be confirmed upon order placement.</span>
        </div>
      </div>

      {/* Retry Alert if last submission was uncertain */}
      {lastError && checkoutStatus === "uncertain" && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 mb-4 text-xs space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span>Submission Alert</span>
          </p>
          <p>{lastError}</p>
          <p className="text-[11px] text-amber-800 opacity-90">
            You can safely tap "Retry Order" — idempotency prevents duplicate charges.
          </p>
        </div>
      )}

      {/* Fixed Checkout Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 p-4 safe-bottom bg-gradient-to-t from-background via-background/90 to-transparent">
        <div className="max-w-md mx-auto">
          <Button
            onClick={() => placeOrder()}
            disabled={isSubmitting}
            size="lg"
            className="w-full h-16 rounded-3xl text-base font-bold shadow-glow tap-scale flex items-center justify-between px-6"
          >
            <div className="flex items-center gap-2">
              {isCapturingLocation ? (
                <Navigation className="h-5 w-5 animate-pulse" />
              ) : (
                <Send className="h-5 w-5" />
              )}
              <span>
                {isCapturingLocation
                  ? "Verifying GPS..."
                  : isSubmitting
                  ? "Sending Order..."
                  : checkoutStatus === "uncertain"
                  ? "Retry Order"
                  : "Place Table Order"}
              </span>
            </div>

            <span className="bg-white/20 backdrop-blur px-3.5 py-1.5 rounded-2xl text-sm font-bold">
              {formatCurrency(estimatedSubtotal)}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function OrderCartPage() {
  return (
    <OrderSessionGuard>
      <CartPageContent />
    </OrderSessionGuard>
  );
}
