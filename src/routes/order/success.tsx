import React, { useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { CheckCircle2, UtensilsCrossed, Clock, XCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { celebrate } from "@/lib/confetti";
import { useCustomerOrder } from "@/features/orders/hooks/useCustomerOrders";
import { OrderTimeline } from "@/features/orders/components/OrderTimeline";
import { PageLoading } from "@/components/feedback/PageLoading";
import { queryKeys } from "@/lib/queryClient";

export default function OrderSuccessPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const stateOrder = location.state?.order;

  // Seed TanStack Query cache with stateOrder so initial render is instantaneous
  useEffect(() => {
    if (orderId && stateOrder) {
      queryClient.setQueryData(queryKeys.order(orderId), (old) => old ?? stateOrder);
    }
  }, [orderId, stateOrder, queryClient]);

  // Authoritative fetched order from React Query / Socket.IO updates
  const { order: fetchedOrder, isLoading } = useCustomerOrder(orderId);
  // Authoritative fetchedOrder takes precedence over stale navigation state
  const order = fetchedOrder ?? stateOrder;

  useEffect(() => {
    celebrate();
  }, []);

  if (isLoading && !order) {
    return <PageLoading message="Loading order confirmation..." />;
  }

  const stepKey = (order?.currentStepKey || "placed").toLowerCase();
  const systemState = (order?.systemState || "").toUpperCase();

  const isCancelled =
    systemState === "CANCELLED" ||
    order?.cancellation != null ||
    stepKey === "cancelled";
  const isCompleted = !isCancelled && (systemState === "COMPLETED" || stepKey === "completed");
  const isServed = !isCancelled && !isCompleted && stepKey === "served";

  let headerSubtitle = "Order Received";
  let headerTitle = "Order Placed!";
  let headerDescription = "Your order has been received by the restaurant.";

  if (isCancelled) {
    headerSubtitle = "Order Cancelled";
    headerTitle = "Order Cancelled";
    headerDescription = "This order was cancelled by the restaurant.";
  } else if (isCompleted) {
    headerSubtitle = "Order Complete";
    headerTitle = "All Done!";
    headerDescription = "Thank you for dining with us. We hope you enjoyed your meal!";
  } else if (isServed) {
    headerSubtitle = "Order Served";
    headerTitle = "Food at Your Table!";
    headerDescription = "Your order has been served to your table. Enjoy!";
  }

  return (
    <div className="min-h-dvh pb-20 px-5 pt-8 safe-top animate-fade-in">
      {/* Dynamic Status Header */}
      <div className="text-center mb-8">
        <div
          className={`mx-auto mb-4 h-24 w-24 rounded-full flex items-center justify-center shadow-glow animate-pop-in ${
            isCancelled
              ? "bg-destructive/10 text-destructive"
              : isCompleted
              ? "bg-emerald-100 text-emerald-600"
              : "gradient-gold text-gold-foreground"
          }`}
        >
          {isCancelled ? (
            <XCircle className="h-12 w-12" />
          ) : (
            <CheckCircle2 className="h-12 w-12" />
          )}
        </div>
        <span
          className={`text-xs uppercase tracking-widest font-bold ${
            isCancelled ? "text-destructive" : isCompleted ? "text-emerald-600" : "text-primary"
          }`}
        >
          {headerSubtitle}
        </span>
        <h1 className="font-display text-4xl font-bold leading-tight mt-1 text-foreground">
          {headerTitle}
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-xs mx-auto">
          {headerDescription}
        </p>
      </div>

      {/* Order Snapshot & Realtime Timeline */}
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
