import React from "react";
import { CheckCircle2, Clock, Utensils } from "lucide-react";
import type { CustomerOrder } from "../types";
import { formatCurrency } from "@/lib/utils";

interface OrderTimelineProps {
  order: CustomerOrder;
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ order }) => {
  const steps = [
    { key: "placed", label: "Order Placed", desc: "Sent to kitchen & assigned waiter" },
    { key: "served", label: "Served", desc: "Delivered to your table" },
    { key: "completed", label: "Completed", desc: "Order finished" },
  ];

  const currentStep = (order.currentStepKey || "placed").toLowerCase();
  const getStepIndex = (key: string) => steps.findIndex((s) => s.key === key);
  const currentIndex = Math.max(0, getStepIndex(currentStep));

  return (
    <div className="bg-card border border-border rounded-3xl p-5 shadow-soft">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/60">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Order Number
          </p>
          <p className="font-display text-2xl font-bold text-foreground mt-0.5">
            #{order.orderNumber}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Total
          </p>
          <p className="font-display text-xl font-bold text-primary mt-0.5">
            {formatCurrency(order.pricing?.total, order.pricing?.currency)}
          </p>
        </div>
      </div>

      {/* Visual Step Timeline */}
      <div className="space-y-4 my-4">
        {steps.map((step, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.key} className="flex items-start gap-3 relative">
              {idx < steps.length - 1 && (
                <div
                  className={`absolute left-4 top-8 bottom-0 w-0.5 -mb-4 ${
                    idx < currentIndex ? "bg-primary" : "bg-border"
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
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      <Clock className="h-3 w-3 animate-spin" /> In Progress
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Items Snapshot */}
      <div className="mt-5 pt-4 border-t border-border/60">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
          Ordered Items
        </p>
        <div className="space-y-2">
          {order.items?.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-foreground">
                <span className="font-bold text-primary mr-1.5">{item.quantity}×</span>
                {item.name}
              </span>
              <span className="font-semibold text-foreground">
                {formatCurrency(item.lineTotal || item.unitPrice * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderTimeline;
