import { RESTAURANTS } from "./mockData";

export type QRPayload =
  | { kind: "loyalty"; restaurantId: string }
  | { kind: "menu"; restaurantId: string }
  | { kind: "unknown"; raw: string };

// Accepts:
//   stamp://loyalty/<restaurantId>
//   stamp://menu/<restaurantId>
//   {"app":"stamp","type":"loyalty","restaurantId":"..."}
//   plain restaurant id
export function parseQR(text: string): QRPayload {
  const trimmed = text.trim();

  // URL form
  const urlMatch = trimmed.match(/^stamp:\/\/(loyalty|menu)\/([\w-]+)/i);
  if (urlMatch) {
    const kind = urlMatch[1].toLowerCase() as "loyalty" | "menu";
    return { kind, restaurantId: urlMatch[2] };
  }

  // JSON form
  try {
    const obj = JSON.parse(trimmed);
    if (obj?.app === "stamp" && obj?.restaurantId && (obj.type === "loyalty" || obj.type === "menu")) {
      return { kind: obj.type, restaurantId: obj.restaurantId };
    }
  } catch {}

  // Plain id fallback → loyalty
  const known = RESTAURANTS.find((r) => r.id === trimmed);
  if (known) return { kind: "loyalty", restaurantId: known.id };

  return { kind: "unknown", raw: trimmed };
}

export const DEMO_CODES = RESTAURANTS.flatMap((r) => [
  { label: `${r.emoji} ${r.name} — Stamp`, code: `stamp://loyalty/${r.id}` },
  { label: `${r.emoji} ${r.name} — Menu`, code: `stamp://menu/${r.id}` },
]);
