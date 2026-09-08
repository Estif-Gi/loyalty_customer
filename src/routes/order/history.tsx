import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Clock, Utensils, RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCustomerOrders } from "@/features/orders/hooks/useCustomerOrders";
import { useActiveOrderSession } from "@/features/order-session/hooks/useActiveOrderSession";
import { OrderTimeline } from "@/features/orders/components/OrderTimeline";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { PageLoading } from "@/components/feedback/PageLoading";
import { EmptyState } from "@/components/feedback/EmptyState";
import { cn } from "@/lib/utils";

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasActiveSession } = useActiveOrderSession();

  const urlTab = searchParams.get("tab");
  const initialTab = urlTab === "history" || urlTab === "active" ? urlTab : "active";
  const [tab, setTabState] = useState<"active" | "history">(initialTab);
  const [page, setPage] = useState<number>(() => {
    const p = parseInt(searchParams.get("page") || "1", 10);
    return isNaN(p) || p < 1 ? 1 : p;
  });

  // Keep state in sync with URL search params
  useEffect(() => {
    if (urlTab === "history" || urlTab === "active") {
      setTabState(urlTab);
    }
  }, [urlTab]);

  const setTab = (newTab: "active" | "history") => {
    setTabState(newTab);
    setPage(1);
    setSearchParams({ tab: newTab, page: "1" }, { replace: true });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSearchParams({ tab, page: String(newPage) }, { replace: true });
  };

  const { orders, isLoading, isError, refetch } = useCustomerOrders(tab, page, 10);

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/home");
    }
  };

  return (
    <div className="min-h-dvh pb-28 px-5 pt-6 safe-top animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
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
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
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

      {/* Content */}
      {isLoading ? (
        <PageLoading message="Loading orders..." />
      ) : isError ? (
        <div className="bg-card border border-border rounded-3xl p-6 text-center shadow-soft">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-2" />
          <h3 className="font-display text-xl font-bold">Failed to load orders</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Could not retrieve your orders. Please check your network and try again.
          </p>
          <Button onClick={() => refetch()} size="sm" className="rounded-full">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Try Again
          </Button>
        </div>
      ) : orders.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            imageSrc="/images/states/empty-state.svg"
            title={tab === "active" ? "No Active Orders" : "No Past Orders"}
            description={
              tab === "active"
                ? "You don't have any active orders right now. Check out the menu or scan a table QR code to place an order."
                : "Your completed orders will appear here once fulfilled."
            }
            actionLabel={
              tab === "active"
                ? hasActiveSession
                  ? "Browse Menu"
                  : "Scan Table QR"
                : "Browse Spots"
            }
            onAction={() => {
              if (tab === "active") {
                if (hasActiveSession) {
                  navigate("/order/menu");
                } else {
                  navigate("/scan");
                }
              } else {
                navigate("/restaurants");
              }
            }}
          />
          {tab === "active" && (
            <div className="text-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTab("history")}
                className="text-xs text-primary font-semibold tap-scale"
              >
                View Past Orders &rarr;
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id || order._id} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-muted-foreground font-medium">
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </span>
                <OrderStatusBadge stepKey={order.currentStepKey} systemState={order.systemState} />
              </div>
              <OrderTimeline order={order} />
            </div>
          ))}

          {/* Pagination Controls */}
          {(page > 1 || orders.length === 10) && (
            <div className="flex items-center justify-between pt-4 pb-2 px-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                className="rounded-full text-xs"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <span className="text-xs text-muted-foreground font-semibold">
                Page {page}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={orders.length < 10}
                onClick={() => handlePageChange(page + 1)}
                className="rounded-full text-xs"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
