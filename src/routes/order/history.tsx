import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Utensils, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCustomerOrders } from "@/features/orders/hooks/useCustomerOrders";
import { OrderTimeline } from "@/features/orders/components/OrderTimeline";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { PageLoading } from "@/components/feedback/PageLoading";
import { EmptyState } from "@/components/feedback/EmptyState";
import { cn, formatCurrency } from "@/lib/utils";

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"active" | "history">("active");

  const { orders, isLoading, refetch } = useCustomerOrders(tab);

  return (
    <div className="min-h-dvh pb-28 px-5 pt-6 safe-top animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-foreground tap-scale"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-3xl font-bold leading-tight">My Orders</h1>
            <p className="text-xs text-muted-foreground">Track active & previous table orders</p>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground tap-scale"
          aria-label="Refresh orders"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-secondary/80 p-1 rounded-2xl mb-6 border border-border">
        <button
          onClick={() => setTab("active")}
          className={cn(
            "flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider tap-scale transition-all",
            tab === "active"
              ? "bg-card text-foreground shadow-soft"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Active Orders
        </button>
        <button
          onClick={() => setTab("history")}
          className={cn(
            "flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider tap-scale transition-all",
            tab === "history"
              ? "bg-card text-foreground shadow-soft"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Order History
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <PageLoading message="Loading orders..." />
      ) : orders.length === 0 ? (
        <EmptyState
          imageSrc="/images/states/empty-state.svg"
          title={tab === "active" ? "No Active Orders" : "No Past Orders"}
          description={
            tab === "active"
              ? "You don't have any active orders right now. Check out the menu to place an order."
              : "Your completed orders will appear here."
          }
          actionLabel="Browse Menu"
          onAction={() => navigate("/order/menu")}
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-muted-foreground font-medium">
                  {new Date(order.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <OrderStatusBadge stepKey={order.currentStepKey} systemState={order.systemState} />
              </div>
              <OrderTimeline order={order} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
