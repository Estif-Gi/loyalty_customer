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
  const normalizedKey = (stepKey || "").toLowerCase();

  let label = "Placed";
  let variantClasses = "bg-amber-100 text-amber-800 border-amber-300";

  switch (normalizedKey) {
    case "placed":
      label = "Placed";
      variantClasses = "bg-amber-100 text-amber-800 border-amber-300";
      break;
    case "served":
      label = "Served";
      variantClasses = "bg-blue-100 text-blue-800 border-blue-300";
      break;
    case "completed":
      label = "Completed";
      variantClasses = "bg-emerald-100 text-emerald-800 border-emerald-300";
      break;
    case "cancelled":
      label = "Cancelled";
      variantClasses = "bg-red-100 text-red-800 border-red-300";
      break;
    default:
      if (systemState === "COMPLETED") {
        label = "Completed";
        variantClasses = "bg-emerald-100 text-emerald-800 border-emerald-300";
      } else if (systemState === "IN_PROGRESS") {
        label = "Served";
        variantClasses = "bg-blue-100 text-blue-800 border-blue-300";
      }
      break;
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
