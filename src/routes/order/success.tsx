import React, { useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { CheckCircle2, UtensilsCrossed, Clock, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { celebrate } from "@/lib/confetti";
import { useCustomerOrder } from "@/features/orders/hooks/useCustomerOrders";
import { OrderTimeline } from "@/features/orders/components/OrderTimeline";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { PageLoading } from "@/components/feedback/PageLoading";
import { formatCurrency } from "@/lib/utils";

export default function OrderSuccessPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Try to use order passed via navigation state first for instant rendering
  const stateOrder = location.state?.order;
  const { order: fetchedOrder, isLoading } = useCustomerOrder(orderId);
  const order = stateOrder || fetchedOrder;

  useEffect(() => {
    celebrate();
  }, []);

  if (isLoading && !order) {
    return <PageLoading message="Loading order confirmation..." />;
  }

  return (
    <div className="min-h-dvh pb-20 px-5 pt-8 safe-top animate-fade-in">
      {/* Success Badge */}
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 h-24 w-24 rounded-full gradient-gold flex items-center justify-center shadow-glow animate-pop-in">
          <CheckCircle2 className="h-12 w-12 text-gold-foreground" />
        </div>
        <span className="text-xs uppercase tracking-widest text-primary font-bold">
          Order Received
        </span>
        <h1 className="font-display text-4xl font-bold leading-tight mt-1 text-foreground">
          Order Placed!
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-xs mx-auto">
          Your order has been sent directly to the kitchen and table staff.
        </p>
      </div>

      {/* Order Snapshot & Timeline */}
      {order && (
        <div className="mb-8">
          <OrderTimeline order={order} />
        </div>
      )}

      {/* Multi-Order Actions */}
      <div className="space-y-3 max-w-sm mx-auto">
        <Button
          onClick={() => navigate("/order/menu", { replace: true })}
          size="lg"
          className="w-full h-14 rounded-2xl text-base font-bold shadow-soft tap-scale flex items-center justify-center gap-2"
        >
          <UtensilsCrossed className="h-5 w-5" />
          <span>Continue Ordering (Same Table)</span>
        </Button>

        <Button
          variant="outline"
          onClick={() => navigate("/order/history")}
          className="w-full h-12 rounded-2xl text-sm font-semibold tap-scale flex items-center justify-center gap-2"
        >
          <Clock className="h-4 w-4" />
          <span>View All Orders</span>
        </Button>
      </div>
    </div>
  );
}
