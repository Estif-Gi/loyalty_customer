import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function toHexPair(value: number) {
  return Math.round(value * 255)
    .toString(16)
    .padStart(2, "0");
}

export function withOpacity(color: string | undefined, opacity: number) {
  if (!color) return undefined;

  const trimmed = color.trim();
  const alpha = Math.max(0, Math.min(1, opacity));

  const hexMatch = trimmed.match(/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    const normalized =
      hex.length === 3
        ? `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`
        : hex.length === 4
        ? `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
        : hex.length === 6
        ? hex
        : hex.slice(0, 6);

    return `#${normalized}${toHexPair(alpha)}`;
  }

  const funcMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9]*)\((.*)\)$/);
  if (funcMatch) {
    const name = funcMatch[1];
    const body = funcMatch[2].trim();

    if (body.includes("/")) {
      const beforeSlash = body.split("/")[0].trim();
      return `${name}(${beforeSlash} / ${alpha})`;
    }

    return `${name}(${body} / ${alpha})`;
  }

  return trimmed;
}
