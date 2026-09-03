import React from "react";
import { cn } from "@/lib/utils";
import type { OrderWorkflowStep, OrderSystemState } from "../types";

interface OrderStatusBadgeProps {
  stepKey: OrderWorkflowStep | string;
  systemState?: OrderSystemState | string;
  className?: string;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({
  stepKey,
  systemState,
  className,
}) => {
  const normalizedState = (systemState || "").toUpperCase();
  const normalizedKey = (stepKey || "").toLowerCase();

  let label = "Placed";
  let variantClasses = "bg-amber-100 text-amber-800 border-amber-300";

  // Precedence: 1. CANCELLED, 2. COMPLETED, 3. currentStepKey
  if (normalizedState === "CANCELLED" || normalizedKey === "cancelled") {
    label = "Cancelled";
    variantClasses = "bg-red-100 text-red-800 border-red-300";
  } else if (normalizedState === "COMPLETED" || normalizedKey === "completed") {
    label = "Completed";
    variantClasses = "bg-emerald-100 text-emerald-800 border-emerald-300";
  } else {
    switch (normalizedKey) {
      case "served":
        label = "Served";
        variantClasses = "bg-blue-100 text-blue-800 border-blue-300";
        break;
      case "placed":
      default:
        if (normalizedState === "IN_PROGRESS") {
          label = "Served";
          variantClasses = "bg-blue-100 text-blue-800 border-blue-300";
        } else {
          label = "Placed";
          variantClasses = "bg-amber-100 text-amber-800 border-amber-300";
        }
        break;
    }
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
        variantClasses,
        className
      )}
    >
      {label}
    </span>
  );
};

export default OrderStatusBadge;
