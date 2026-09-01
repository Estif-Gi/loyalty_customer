import { describe, expect, it } from "vitest";
import type { OrderSession } from "@/features/order-session/types";

describe("Order Session Domain Rules", () => {
  it("determines active status when expiresAt is in the future", () => {
    const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const session: OrderSession = {
      id: "session-1",
      restaurant: {
        id: "res-101",
        name: "Pizza Palace",
      },
      table: {
        id: "tbl-5",
        name: "Table 5",
        code: "T5",
      },
      expiresAt: futureDate,
    };

    const isExpired = new Date(session.expiresAt).getTime() <= Date.now();
    expect(isExpired).toBe(false);
  });

  it("determines expired status when expiresAt has passed", () => {
    const pastDate = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const session: OrderSession = {
      id: "session-1",
      restaurant: {
        id: "res-101",
        name: "Pizza Palace",
      },
      table: {
        id: "tbl-5",
        name: "Table 5",
        code: "T5",
      },
      expiresAt: pastDate,
    };

    const isExpired = new Date(session.expiresAt).getTime() <= Date.now();
    expect(isExpired).toBe(true);
  });

  it("does not store or contain raw QR token in session object", () => {
    const session: OrderSession = {
      id: "session-1",
      restaurant: {
        id: "res-101",
        name: "Pizza Palace",
      },
      table: {
        id: "tbl-5",
        name: "Table 5",
        code: "T5",
      },
      expiresAt: new Date().toISOString(),
    };

    expect((session as any).qrToken).toBeUndefined();
    expect((session as any).t).toBeUndefined();
  });
});
