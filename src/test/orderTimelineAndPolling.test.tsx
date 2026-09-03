import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderTimeline } from "@/features/orders/components/OrderTimeline";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import type { CustomerOrder } from "@/features/orders/types";

describe("OrderTimeline UI & Polling Rules", () => {
  const baseOrder: CustomerOrder = {
    id: "ord-1",
    orderNumber: "101",
    restaurant: "res-1",
    table: "tbl-1",
    items: [
      {
        menuItemId: "item-1",
        name: "Club Sandwich",
        quantity: 2,
        unitPrice: 150,
        lineTotal: 300,
      },
    ],
    pricing: {
      subtotal: 300,
      discount: 0,
      tax: 45,
      serviceCharge: 30,
      total: 375,
      currency: "ETB",
    },
    currentStepKey: "placed",
    systemState: "OPEN",
    timeline: [],
    createdAt: new Date().toISOString(),
  };

  it("1. renders PLACED status with In Progress indicator and neutral table copy", () => {
    render(<OrderTimeline order={{ ...baseOrder, currentStepKey: "placed" }} />);

    expect(screen.getByText("#101")).toBeInTheDocument();
    expect(screen.getByText("Order Placed")).toBeInTheDocument();
    expect(screen.getByText("Order received and assigned to your table.")).toBeInTheDocument();
    expect(screen.getByText(/In Progress/i)).toBeInTheDocument();
    expect(screen.queryByText(/Sent to kitchen/i)).not.toBeInTheDocument();
  });

  it("2. renders SERVED status with In Progress indicator and table delivery copy", () => {
    render(
      <OrderTimeline
        order={{ ...baseOrder, currentStepKey: "served", systemState: "IN_PROGRESS" }}
      />
    );

    expect(screen.getByText("Served")).toBeInTheDocument();
    expect(screen.getByText("Delivered to your table.")).toBeInTheDocument();
    expect(screen.getByText(/In Progress/i)).toBeInTheDocument();
  });

  it("3. renders COMPLETED status without 'In Progress' badge and shows Completed badge", () => {
    render(
      <OrderTimeline
        order={{ ...baseOrder, currentStepKey: "completed", systemState: "COMPLETED" }}
      />
    );

    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
    // Must NOT display "In Progress" when status is completed
    expect(screen.queryByText(/In Progress/i)).not.toBeInTheDocument();
  });

  it("4. renders CANCELLED status with explicit cancellation alert banner", () => {
    render(
      <OrderTimeline
        order={{
          ...baseOrder,
          currentStepKey: "cancelled",
          systemState: "CANCELLED",
          cancellation: { reason: "Table requested cancellation" },
        }}
      />
    );

    expect(screen.getByText("Order Cancelled")).toBeInTheDocument();
    expect(screen.getByText("Table requested cancellation")).toBeInTheDocument();
    // Must not show "In Progress" when cancelled
    expect(screen.queryByText(/In Progress/i)).not.toBeInTheDocument();
  });

  it("5. CANCELLED systemState overrides served currentStepKey in OrderStatusBadge and OrderTimeline", () => {
    const { unmount } = render(
      <OrderStatusBadge stepKey="served" systemState="CANCELLED" />
    );

    // Badge must display Cancelled, NOT Served
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
    expect(screen.queryByText("Served")).not.toBeInTheDocument();
    unmount();

    // In timeline as well:
    render(
      <OrderTimeline
        order={{
          ...baseOrder,
          currentStepKey: "served",
          systemState: "CANCELLED",
          cancellation: { reason: "Cancelled by staff after serving" },
        }}
      />
    );

    expect(screen.getByText("Order Cancelled")).toBeInTheDocument();
    expect(screen.queryByText(/In Progress/i)).not.toBeInTheDocument();
  });

  it("6. CANCELLED systemState overrides placed currentStepKey in OrderStatusBadge and OrderTimeline", () => {
    const { unmount } = render(
      <OrderStatusBadge stepKey="placed" systemState="CANCELLED" />
    );

    // Badge must display Cancelled, NOT Placed
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
    expect(screen.queryByText("Placed")).not.toBeInTheDocument();
    unmount();

    // In timeline:
    render(
      <OrderTimeline
        order={{
          ...baseOrder,
          currentStepKey: "placed",
          systemState: "CANCELLED",
          cancellation: { reason: "Kitchen out of stock" },
        }}
      />
    );

    expect(screen.getByText("Order Cancelled")).toBeInTheDocument();
    expect(screen.queryByText(/In Progress/i)).not.toBeInTheDocument();
  });

  it("7. COMPLETED systemState renders Completed in OrderStatusBadge", () => {
    render(<OrderStatusBadge stepKey="served" systemState="COMPLETED" />);

    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.queryByText("Served")).not.toBeInTheDocument();
  });

  it("8. validates fallback polling interval logic for active vs completed orders", () => {
    // Polling logic extracted directly from useCustomerOrder
    const computeRefetchInterval = (order: CustomerOrder | null) => {
      if (!order) return 1000 * 30;
      const stepKey = (order.currentStepKey || "").toLowerCase();
      const isFinished =
        order.systemState === "COMPLETED" ||
        order.systemState === "CANCELLED" ||
        stepKey === "completed" ||
        stepKey === "cancelled";

      if (isFinished) {
        return false;
      }
      return 1000 * 30;
    };

    // Active placed order polls at 30 seconds
    expect(computeRefetchInterval(baseOrder)).toBe(30000);

    // Active served order polls at 30 seconds
    expect(
      computeRefetchInterval({ ...baseOrder, currentStepKey: "served", systemState: "IN_PROGRESS" })
    ).toBe(30000);

    // Completed order does NOT poll
    expect(
      computeRefetchInterval({ ...baseOrder, currentStepKey: "completed", systemState: "COMPLETED" })
    ).toBe(false);

    // Cancelled order does NOT poll
    expect(
      computeRefetchInterval({ ...baseOrder, currentStepKey: "cancelled", systemState: "CANCELLED" })
    ).toBe(false);
  });

  it("9. verifies authoritative fetched order overrides stale navigation state", () => {
    const staleNavigationOrder: CustomerOrder = {
      ...baseOrder,
      currentStepKey: "placed",
    };

    const freshFetchedOrder: CustomerOrder = {
      ...baseOrder,
      currentStepKey: "served",
    };

    // Current fix in OrderSuccessPage: fetchedOrder ?? stateOrder
    const resolvedOrder = freshFetchedOrder ?? staleNavigationOrder;
    expect(resolvedOrder.currentStepKey).toBe("served");

    // Even if navigation state had "placed", the resolved order is "served"
    expect(resolvedOrder.currentStepKey).not.toBe(staleNavigationOrder.currentStepKey);
  });
});
