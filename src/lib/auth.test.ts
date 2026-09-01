import { describe, expect, it } from "vitest";
import { normalizeUser, resolveRedirectPath } from "./auth";

describe("auth utilities", () => {
  it("normalizes MongoDB-style users with _id", () => {
    const user = normalizeUser({ _id: "mongo-123", name: "Ada" });

    expect(user).not.toBeNull();
    expect(user?.id).toBe("mongo-123");
    expect(user?.name).toBe("Ada");
  });

  it("keeps internal redirect paths and ignores external targets", () => {
    expect(resolveRedirectPath({ pathname: "/rewards", search: "?tab=1", hash: "#top" })).toBe("/rewards?tab=1#top");
    expect(resolveRedirectPath({ pathname: "https://evil.com" })).toBe("/home");
  });
});
