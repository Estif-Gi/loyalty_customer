export interface ParsedQR {
  kind: "order-start" | "loyalty" | "menu" | "unknown";
  token?: string;
  restaurantId?: string;
  raw: string;
}

/**
 * Parses raw QR scan content into recognized application destinations.
 */
export function parseQR(text: string): ParsedQR {
  if (!text || typeof text !== "string") {
    return { kind: "unknown", raw: text || "" };
  }

  const trimmed = text.trim();

  // 1. Check for table ordering QR: /order/start?t=<token>
  try {
    const url = trimmed.startsWith("http")
      ? new URL(trimmed)
      : new URL(trimmed, "https://loyalty-customer.vercel.app");
    if (url.pathname.includes("/order/start") && url.searchParams.has("t")) {
      const token = url.searchParams.get("t");
      if (token) {
        return {
          kind: "order-start",
          token: token.trim(),
          raw: trimmed,
        };
      }
    }
  } catch {
    // Not a standard URL
  }

  // 2. Check for legacy/loyalty stamps URL
  const urlPattern = /^(?:https?:\/\/[^/]+)?\/(menu|restaurant)\/([a-f0-9]+)$/i;
  const match = trimmed.match(urlPattern);

  if (match) {
    const type = match[1].toLowerCase();
    const restaurantId = match[2];

    return {
      kind: type === "menu" ? "menu" : "loyalty",
      restaurantId,
      raw: trimmed,
    };
  }

  return {
    kind: "unknown",
    raw: trimmed,
  };
}