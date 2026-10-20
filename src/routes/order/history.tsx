import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  Utensils,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Calendar,
  CheckCircle2,
  XCircle,
  UtensilsCrossed,
  Receipt,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCustomerOrders } from "@/features/orders/hooks/useCustomerOrders";
import { useActiveOrderSession } from "@/features/order-session/hooks/useActiveOrderSession";
import { PageLoading } from "@/components/feedback/PageLoading";
import { EmptyState } from "@/components/feedback/EmptyState";
import { cn, formatCurrency } from "@/lib/utils";
import type { CustomerOrder } from "@/features/orders/types";

interface OrderSessionGroup {
  key: string;
  sessionId?: string;
  restaurantId?: string;
  restaurantName: string;
  tableName: string;
  sessionDate: Date;
  dateLabel: string;
  timeLabel: string;
  isCurrentSession: boolean;
  totalAmount: number;
  currency: string;
  totalItemsCount: number;
  orders: CustomerOrder[];
  hasActiveOrder: boolean;
}

function formatSessionDate(date: Date): string {
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function getSessionGroupingKey(order: CustomerOrder): { key: string; explicitSessionId?: string } {
  const explicitId =
    order.orderSessionId ||
    (typeof order.orderSession === "object" && order.orderSession !== null
      ? order.orderSession.id || order.orderSession._id
      : typeof order.orderSession === "string"
      ? order.orderSession
      : null) ||
    order.sessionId ||
    (order as any).session;

  if (explicitId) {
    return { key: `session_${explicitId}`, explicitSessionId: String(explicitId) };
  }

  // Fallback: group by same restaurant + table + calendar day
  const resName =
    typeof order.restaurant === "object" && order.restaurant !== null
      ? order.restaurant.name || order.restaurant.id || order.restaurant._id
      : order.restaurant || "Restaurant";

  const tableName =
    typeof order.table === "object" && order.table !== null
      ? order.table.name || order.table.code
      : order.table || "Dine-in";

  const dateKey = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "undated";

  return { key: `visit_${resName}_${tableName}_${dateKey}` };
}

/**
 * Compact, modern status badge for completed, active, and cancelled orders
 */
function OrderStatusPill({ order }: { order: CustomerOrder }) {
  const stepKey = (order.currentStepKey || "").toLowerCase();
  const systemState = (order.systemState || "").toUpperCase();

  const isCancelled =
    systemState === "CANCELLED" ||
    order.cancellation != null ||
    stepKey === "cancelled";

  const isCompleted =
    !isCancelled &&
    (systemState === "COMPLETED" || stepKey === "completed");

  const isServed =
    !isCancelled &&
    !isCompleted &&
    (stepKey === "served" || Boolean(order.service?.servedAt));

  const isPreparing =
    !isCancelled &&
    !isCompleted &&
    !isServed &&
    (systemState === "IN_PROGRESS" ||
      stepKey === "preparing" ||
      stepKey === "in_progress" ||
      stepKey === "serving");

  if (isCancelled) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
        <XCircle className="h-3 w-3" />
        Cancelled
      </span>
    );
  }

  if (isCompleted) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="h-3 w-3" />
        Completed
      </span>
    );
  }

  if (isServed) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
        <UtensilsCrossed className="h-3 w-3" />
        Food Served
      </span>
    );
  }

  if (isPreparing) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
        <Clock className="h-3 w-3 animate-spin" />
        Preparing
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
      <Clock className="h-3 w-3" />
      Placed
    </span>
  );
}

/**
 * Step timeline with checkmarked status circles for active orders
 */
function ActiveOrderCheckmarkTimeline({ order }: { order: CustomerOrder }) {
  const steps = [
    { key: "placed", label: "Order Placed", desc: "Order received and assigned to your table." },
    { key: "served", label: "Served", desc: "Delivered to your table." },
    { key: "completed", label: "Completed", desc: "Order finished." },
  ];

  const currentStep = (order.currentStepKey || "placed").toLowerCase();
  const systemState = (order.systemState || "").toUpperCase();

  const isCancelled =
    systemState === "CANCELLED" ||
    order.cancellation != null ||
    currentStep === "cancelled";

  const isCompleted =
    !isCancelled &&
    (systemState === "COMPLETED" || currentStep === "completed");

  const isServed =
    !isCancelled &&
    !isCompleted &&
    (currentStep === "served" || Boolean(order.service?.servedAt));

  const getStepIndex = (key: string) => steps.findIndex((s) => s.key === key);
  const currentIndex = isCancelled
    ? -1
    : isCompleted
    ? 2
    : isServed
    ? 1
    : Math.max(0, getStepIndex(currentStep));

  return (
    <div className="bg-secondary/30 border border-border/60 rounded-2xl p-4 my-3 space-y-4">
      {steps.map((step, idx) => {
        const isDone = !isCancelled && idx <= currentIndex;
        const isCurrent = !isCancelled && idx === currentIndex;

        return (
          <div key={step.key} className="flex items-start gap-3 relative">
            {idx < steps.length - 1 && (
              <div
                className={`absolute left-4 top-8 bottom-0 w-0.5 -mb-4 ${
                  !isCancelled && idx < currentIndex ? "bg-primary" : "bg-border"
                }`}
              />
            )}
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 z-10 ${
                isDone
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-muted-foreground border border-border"
              }`}
            >
              {isDone ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center justify-between">
                <p
                  className={`font-semibold leading-tight text-sm ${
                    isCurrent ? "text-primary font-bold" : "text-foreground"
                  }`}
                >
                  {step.label}
                </p>
                {isCurrent && (
                  step.key === "completed" ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3" /> Done
                    </span>
                  ) : step.key === "served" ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3" /> Food Served &bull; In Progress
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                      <Clock className="h-3 w-3 animate-spin" />{" "}
                      {systemState === "IN_PROGRESS" ||
                      currentStep === "preparing" ||
                      currentStep === "in_progress"
                        ? "Preparing"
                        : "In Progress"}
                    </span>
                  )
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { session: activeSession, hasActiveSession } = useActiveOrderSession();

  const urlTab = searchParams.get("tab");
  const initialTab = urlTab === "history" || urlTab === "active" ? urlTab : "active";
  const [tab, setTabState] = useState<"active" | "history">(initialTab);
  const [page, setPage] = useState<number>(() => {
    const p = parseInt(searchParams.get("page") || "1", 10);
    return isNaN(p) || p < 1 ? 1 : p;
  });

  // Track collapsed session groups
  const [collapsedSessions, setCollapsedSessions] = useState<Record<string, boolean>>({});

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

  const toggleSessionCollapse = (key: string) => {
    setCollapsedSessions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const { orders, isLoading, isError, refetch } = useCustomerOrders(tab, page, 10);

  // Group orders by session ID or table dining visit
  const sessionGroups = useMemo<OrderSessionGroup[]>(() => {
    if (!orders || orders.length === 0) return [];

    const map = new Map<string, OrderSessionGroup>();

    for (const order of orders) {
      const { key, explicitSessionId } = getSessionGroupingKey(order);

      const resObj = typeof order.restaurant === "object" && order.restaurant !== null ? order.restaurant : null;
      const resName = resObj?.name || (typeof order.restaurant === "string" ? order.restaurant : "Restaurant");
      const resId = resObj?.id || resObj?._id;

      const tblName =
        typeof order.table === "object" && order.table !== null
          ? order.table.name || (order.table.code ? `Table ${order.table.code}` : "Table")
          : order.table
          ? `Table ${order.table}`
          : "Table";

      const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
      const orderTotal = Number(order.pricing?.total) || 0;
      const currency = order.pricing?.currency || "ETB";
      const itemsCount = (order.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);

      const isStepActive =
        order.systemState === "OPEN" ||
        order.systemState === "IN_PROGRESS" ||
        order.currentStepKey === "placed" ||
        order.currentStepKey === "served" ||
        order.currentStepKey === "serving" ||
        order.currentStepKey === "preparing" ||
        order.currentStepKey === "in_progress";

      const isCurrentSession = Boolean(
        activeSession &&
          explicitSessionId &&
          (activeSession.id === explicitSessionId || activeSession._id === explicitSessionId)
      );

      if (!map.has(key)) {
        map.set(key, {
          key,
          sessionId: explicitSessionId,
          restaurantId: resId,
          restaurantName: resName,
          tableName: tblName,
          sessionDate: orderDate,
          dateLabel: formatSessionDate(orderDate),
          timeLabel: orderDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isCurrentSession,
          totalAmount: orderTotal,
          currency,
          totalItemsCount: itemsCount,
          orders: [order],
          hasActiveOrder: isStepActive,
        });
      } else {
        const group = map.get(key)!;
        group.orders.push(order);
        group.totalAmount += orderTotal;
        group.totalItemsCount += itemsCount;
        if (isStepActive) group.hasActiveOrder = true;
        if (isCurrentSession) group.isCurrentSession = true;
        if (!group.restaurantId && resId) group.restaurantId = resId;

        // Keep newest order date as the session's latest time
        if (orderDate.getTime() > group.sessionDate.getTime()) {
          group.sessionDate = orderDate;
          group.dateLabel = formatSessionDate(orderDate);
          group.timeLabel = orderDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }
      }
    }

    // Sort session groups: newest session first
    const groups = Array.from(map.values());
    groups.sort((a, b) => b.sessionDate.getTime() - a.sessionDate.getTime());

    // Within each session, sort orders chronologically so Round 1 comes first
    for (const group of groups) {
      group.orders.sort(
        (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
      );
    }

    return groups;
  }, [orders, activeSession]);

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
            <p className="text-xs text-muted-foreground">Track active & previous table visits</p>
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
      ) : sessionGroups.length === 0 ? (
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
        <div className="space-y-5">
          {sessionGroups.map((group) => {
            const isMultiOrder = group.orders.length > 1;
            const isCollapsed = Boolean(collapsedSessions[group.key]);

            return (
              <div
                key={group.key}
                className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden transition-all"
              >
                {/* Session Card Header */}
                <div
                  onClick={() => isMultiOrder && toggleSessionCollapse(group.key)}
                  className={cn(
                    "p-4 sm:p-5 flex items-start justify-between gap-3 border-b border-border/60",
                    isMultiOrder && "cursor-pointer select-none hover:bg-secondary/20 transition-colors"
                  )}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Utensils className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-base font-bold text-foreground leading-tight truncate">
                          {group.restaurantName}
                        </h2>
                        <span className="text-[11px] font-semibold bg-secondary px-2.5 py-0.5 rounded-full text-foreground border border-border/60">
                          {group.tableName}
                        </span>
                        {group.isCurrentSession && (
                          <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active Session
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {group.dateLabel} at {group.timeLabel}
                        </span>
                        <span>&bull;</span>
                        <span className="font-medium text-foreground/80">
                          {isMultiOrder
                            ? `${group.orders.length} Rounds • ${group.totalItemsCount} items`
                            : `${group.totalItemsCount} ${group.totalItemsCount === 1 ? "item" : "items"}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        {isMultiOrder ? "Session Total" : "Total"}
                      </p>
                      <p className="font-display text-base font-bold text-primary">
                        {formatCurrency(group.totalAmount, group.currency)}
                      </p>
                    </div>
                    {isMultiOrder && (
                      <button
                        type="button"
                        aria-label={isCollapsed ? "Expand rounds" : "Collapse rounds"}
                        className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors ml-1"
                      >
                        {isCollapsed ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Orders Content */}
                {!isCollapsed && (
                  <div className="divide-y divide-border/60">
                    {group.orders.map((order, orderIdx) => {
                      const isOrderCancelled =
                        (order.systemState || "").toUpperCase() === "CANCELLED" ||
                        order.cancellation != null ||
                        (order.currentStepKey || "").toLowerCase() === "cancelled";

                      return (
                        <div key={order.id || order._id} className="p-4 sm:p-5 space-y-3">
                          {/* Round / Order Info Bar */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {isMultiOrder ? (
                                <span className="text-lg font-bold border-2text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg">
                                   {orderIdx + 1}
                                </span>
                              ) : null}
                              <span className="text-sm font-bold text-foreground">
                                Order #{order.orderNumber}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {order.createdAt
                                  ? new Date(order.createdAt).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : ""}
                              </span>
                            </div>
                            <OrderStatusPill order={order} />
                          </div>

                          {/* Cancellation Alert if cancelled */}
                          {isOrderCancelled && (
                            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                              <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-bold">Order Cancelled</p>
                                <p className="text-destructive/90 mt-0.5">
                                  {order.cancellation?.reason || "This order was cancelled by the restaurant."}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Active Order Checkmarked Status Timeline (Only shown when order is active) */}
                          {tab === "active" && !isOrderCancelled && (
                            <ActiveOrderCheckmarkTimeline order={order} />
                          )}

                          {/* Ordered Items List */}
                          <div className="space-y-2 py-1">
                            {order.items?.map((item, itemIdx) => (
                              <div
                                key={itemIdx}
                                className="flex items-start justify-between gap-3 text-sm"
                              >
                                <div className="flex items-start gap-2.5 min-w-0">
                                  <span className="flex-shrink-0 font-bold text-xs px-2 py-0.5 rounded-md bg-secondary text-foreground">
                                    {item.quantity}×
                                  </span>
                                  <div className="min-w-0">
                                    <p className="font-medium text-foreground leading-snug">
                                      {item.name}
                                    </p>
                                    {item.notes && (
                                      <p className="text-xs text-muted-foreground italic truncate">
                                        "{item.notes}"
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <span className="font-semibold text-foreground shrink-0 text-sm">
                                  {formatCurrency(
                                    item.lineTotal || item.unitPrice * item.quantity,
                                    order.pricing?.currency
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Round Subtotal (Shown when multiple rounds exist in one session) */}
                          {isMultiOrder && (
                            <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/40">
                              <span>Round Total:</span>
                              <span className="font-semibold text-foreground">
                                {formatCurrency(order.pricing?.total, order.pricing?.currency)}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Session Footer with Quick Actions */}
                <div className="px-4 py-3 bg-secondary/30 border-t border-border/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Receipt className="h-3.5 w-3.5" />
                    <span>
                      {group.orders.length} {group.orders.length === 1 ? "order" : "rounds"} fulfilled
                    </span>
                  </div>

                  {group.restaurantId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/restaurant/${group.restaurantId}`)}
                      className="h-8 px-3 rounded-full text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 tap-scale"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      View Menu
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

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
