import { describe, expect, it, vi, beforeEach } from "vitest";
import { ordersApi } from "@/features/orders/api/ordersApi";
import * as apiModule from "@/lib/api";

describe("ordersApi /orders/history endpoint & payload contract", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const sampleBackendResponse = {
    success: true,
    data: {
      orders: [
        {
          id: "6a9fcb12a9610e85bddd4bee",
          orderNumber: "ORD-112",
          restaurant: {
            id: "6a84050403c4316af2ca69d0",
            _id: "6a84050403c4316af2ca69d0",
            name: "estifs test place",
            location: "123 Main St",
            phone: "+0987654321",
          },
          table: {
            id: "6a95313e99b8ed65cecdc64a",
            _id: "6a95313e99b8ed65cecdc64a",
            name: "Table E3",
            code: "TABLE E3",
          },
          items: [
            {
              menuItemId: "6a96a309f4fbd25f1637e4b1",
              name: "firfir",
              quantity: 1,
              unitPrice: 200,
              lineTotal: 200,
              notes: "",
            },
          ],
          pricing: {
            subtotal: 200,
            discount: 0,
            tax: 0,
            serviceCharge: 0,
            total: 200,
            currency: "ETB",
          },
          currentStepKey: "completed",
          systemState: "COMPLETED",
          customerNotes: "",
          service: {
            waiter: "6a84084d03c4316af2ca69d3",
            claimedAt: null,
            assignedAt: "2026-09-08T08:45:06.744Z",
            assignmentSource: "table",
            servedAt: null,
          },
          payment: {
            status: "unpaid",
            method: "cash",
            paidAt: null,
          },
          cancellation: null,
          createdAt: "2026-09-08T08:45:06.769Z",
          updatedAt: "2026-09-08T08:46:31.148Z",
        },
      ],
    },
  };

  it("1. fetches order history using /orders/history?page=1&limit=10&status=history", async () => {
    const fetchApiSpy = vi
      .spyOn(apiModule, "fetchApi")
      .mockResolvedValue(sampleBackendResponse);

    const orders = await ordersApi.getMyOrders("history", 1, 10);

    expect(fetchApiSpy).toHaveBeenCalledTimes(1);
    expect(fetchApiSpy).toHaveBeenCalledWith(
      "/orders/history?page=1&limit=10&status=history"
    );

    expect(orders).toHaveLength(1);
    const order = orders[0];
    expect(order.id).toBe("6a9fcb12a9610e85bddd4bee");
    expect(order.orderNumber).toBe("ORD-112");
    expect(typeof order.restaurant === "object" ? order.restaurant.name : "").toBe(
      "estifs test place"
    );
    expect(typeof order.table === "object" ? order.table.name : "").toBe("Table E3");
    expect(order.currentStepKey).toBe("completed");
    expect(order.systemState).toBe("COMPLETED");
  });

  it("2. fetches active orders using /orders/history?page=1&limit=10&status=active", async () => {
    const fetchApiSpy = vi
      .spyOn(apiModule, "fetchApi")
      .mockResolvedValue({
        success: true,
        data: {
          orders: [
            {
              _id: "ord-active-1",
              orderNumber: "ORD-113",
              currentStepKey: "placed",
              systemState: "OPEN",
              items: [],
              pricing: { subtotal: 100, discount: 0, tax: 0, serviceCharge: 0, total: 100, currency: "ETB" },
              createdAt: new Date().toISOString(),
            },
          ],
        },
      });

    const orders = await ordersApi.getMyOrders("active", 1, 10);

    expect(fetchApiSpy).toHaveBeenCalledWith(
      "/orders/history?page=1&limit=10&status=active"
    );
    expect(orders).toHaveLength(1);
    expect(orders[0].id).toBe("ord-active-1");
    expect(orders[0].orderNumber).toBe("ORD-113");
  });

  it("3. getOrderHistory delegates to getMyOrders with 'history' status", async () => {
    const fetchApiSpy = vi
      .spyOn(apiModule, "fetchApi")
      .mockResolvedValue(sampleBackendResponse);

    const orders = await ordersApi.getOrderHistory(2, 20);

    expect(fetchApiSpy).toHaveBeenCalledWith(
      "/orders/history?page=2&limit=20&status=history"
    );
    expect(orders).toHaveLength(1);
  });

  it("4. handles flat array responses and empty responses gracefully without crashing", async () => {
    vi.spyOn(apiModule, "fetchApi").mockResolvedValueOnce([]);
    const emptyOrders = await ordersApi.getMyOrders("history");
    expect(emptyOrders).toEqual([]);

    vi.spyOn(apiModule, "fetchApi").mockResolvedValueOnce(null);
    const nullOrders = await ordersApi.getMyOrders("history");
    expect(nullOrders).toEqual([]);
  });
});
