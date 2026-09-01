import { describe, expect, it, beforeEach } from "vitest";
import { useCheckoutStore } from "@/features/orders/store/checkoutStore";
import { useCartStore } from "@/features/cart/store/cartStore";
import { formatCurrency } from "@/lib/utils";

describe("Multi-Order Flow & Idempotency Architecture", () => {
  beforeEach(() => {
    useCheckoutStore.getState().reset();
    useCartStore.getState().clearCart();
  });

  it("generates a new UUID idempotency key on first order attempt", () => {
    const key1 = useCheckoutStore.getState().getOrCreateKey();
    expect(key1).toBeDefined();
    expect(typeof key1).toBe("string");
    expect(key1.length).toBeGreaterThan(10);
  });

  it("reuses the EXACT same idempotency key when retrying after an uncertain network failure", () => {
    const initialKey = useCheckoutStore.getState().setSubmitting();

    // Simulate ambiguous network failure
    useCheckoutStore.getState().setUncertain("Network timeout. Order may have been received.");

    expect(useCheckoutStore.getState().status).toBe("uncertain");
    // When retrying, getOrCreateKey MUST return the same key
    const retryKey = useCheckoutStore.getState().getOrCreateKey();
    expect(retryKey).toBe(initialKey);
  });

  it("generates a FRESH idempotency key on subsequent new orders (multi-order flow)", () => {
    // Order #1
    const order1Key = useCheckoutStore.getState().setSubmitting();
    useCheckoutStore.getState().setSuccess();

    expect(useCheckoutStore.getState().idempotencyKey).toBeNull();

    // Order #2 (without rescanning QR)
    const order2Key = useCheckoutStore.getState().setSubmitting();
    expect(order2Key).toBeDefined();
    expect(order2Key).not.toBe(order1Key);
  });

  it("scopes cart to active restaurant/session and resets when switching restaurant context", () => {
    const scopeA = { restaurantId: "res-A", orderSessionId: "session-1" };
    useCartStore.getState().addItem(scopeA, {
      menuItemId: "item-1",
      name: "Burger",
      unitPrice: 100,
    });

    expect(useCartStore.getState().items.length).toBe(1);

    // Switch to another restaurant's session
    const scopeB = { restaurantId: "res-B", orderSessionId: "session-2" };
    useCartStore.getState().addItem(scopeB, {
      menuItemId: "item-2",
      name: "Pasta",
      unitPrice: 150,
    });

    // Incompatible cart from Restaurant A was cleared
    expect(useCartStore.getState().items.length).toBe(1);
    expect(useCartStore.getState().items[0].name).toBe("Pasta");
  });

  it("enforces item quantity bounds between 1 and 50", () => {
    const scope = { restaurantId: "res-A", orderSessionId: "session-1" };
    useCartStore.getState().addItem(scope, {
      menuItemId: "item-1",
      name: "Pizza",
      unitPrice: 200,
      quantity: 10,
    });

    // Cannot exceed 50
    useCartStore.getState().updateQuantity("item-1", 75);
    expect(useCartStore.getState().items[0].quantity).toBe(50);

    // Setting <= 0 removes item
    useCartStore.getState().updateQuantity("item-1", 0);
    expect(useCartStore.getState().items.length).toBe(0);
  });

  it("formats currency as ETB properly", () => {
    expect(formatCurrency(250)).toBe("250.00 ETB");
    expect(formatCurrency(0)).toBe("0.00 ETB");
    expect(formatCurrency(19.99, "ETB")).toBe("19.99 ETB");
  });
});
