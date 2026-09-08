import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Clock, Utensils } from "lucide-react";
import { useActiveOrderSession } from "@/features/order-session/hooks/useActiveOrderSession";
import { useCustomerOrders } from "@/features/orders/hooks/useCustomerOrders";
import { useAuth } from "@/features/auth/hooks/useAuth";

/**
 * Top-right floating indicator button.
 * Automatically displays when the customer has an active table session or an order in progress.
 * Clicking navigates directly to the Order History & Status screen.
 */
export function ActiveOrderHeaderButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { hasActiveSession, session } = useActiveOrderSession();
  const { orders: activeOrders } = useCustomerOrders("active");

  // Do not show on splash/auth, or when already viewing the order history/workflow
  const isHiddenRoute =
    location.pathname === "/" ||
    location.pathname === "/onboarding" ||
    location.pathname === "/order/history" ||
    location.pathname === "/order/cart" ||
    location.pathname === "/order/menu" ||
    location.pathname.startsWith("/order/success");

  if (!isAuthenticated || isHiddenRoute) {
    return null;
  }

  const hasActiveOrders = activeOrders.length > 0;

  // Only display if user has an active session or active order
  if (!hasActiveSession && !hasActiveOrders) {
    return null;
  }

  const primaryOrder = activeOrders[0];
  const orderCount = activeOrders.length;

  const handleClick = () => {
    if (hasActiveOrders) {
      navigate("/order/history?tab=active");
    } else {
      navigate("/order/history");
    }
  };

  const tableName =
    session?.table?.name || (session?.table?.code ? `Table ${session.table.code}` : null);

  return (
    <aside
      aria-label="Active order status"
      className="fixed top-0 inset-x-0 z-40 pointer-events-none safe-top"
    >
      <div className="mx-auto max-w-md px-5 pt-3 flex justify-end">
        <button
          onClick={handleClick}
          className="pointer-events-auto flex items-center gap-2 px-3.5 py-2 rounded-full bg-card/95 backdrop-blur-md border border-border shadow-card text-xs font-semibold text-foreground hover:border-primary/50 transition-all tap-scale animate-fade-in group"
          aria-label="View active order status"
        >
          {hasActiveOrders ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                {orderCount > 1
                  ? `${orderCount} Active Orders`
                  : primaryOrder?.orderNumber
                  ? `Order #${primaryOrder.orderNumber}`
                  : "Active Order"}
              </span>
              <Clock className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-primary/70" />
              <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                {tableName || "Active Session"}
              </span>
              <Utensils className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

export default ActiveOrderHeaderButton;
