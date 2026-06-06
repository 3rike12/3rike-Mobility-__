export type ClassValue = string | false | null | undefined;

/** Tiny classnames joiner (no deps). */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}

export type Status = "online" | "warning" | "critical" | "offline";

/** Tailwind/theme tokens per semantic status. */
export const STATUS = {
  online: {
    label: "Online",
    solid: "var(--color-green)",
    text: "text-green",
    dot: "bg-green",
    chip: "chip-online",
    glow: "rgba(1,194,89,0.55)",
  },
  warning: {
    label: "Warning",
    solid: "var(--color-warning)",
    text: "text-warning",
    dot: "bg-warning",
    chip: "chip-warning",
    glow: "rgba(241,176,88,0.55)",
  },
  critical: {
    label: "Critical",
    solid: "var(--color-critical)",
    text: "text-critical",
    dot: "bg-critical",
    chip: "chip-critical",
    glow: "rgba(239,68,68,0.6)",
  },
  offline: {
    label: "Offline",
    solid: "var(--color-offline)",
    text: "text-offline",
    dot: "bg-offline",
    chip: "chip-offline",
    glow: "rgba(255,255,255,0.18)",
  },
} as const;

/** Inventory fill color by percentage (spec: ≥60 green, ≥25 amber, <25 red). */
export function inventoryColor(pct: number): string {
  if (pct >= 60) return "var(--color-green)";
  if (pct >= 25) return "var(--color-warning)";
  return "var(--color-critical)";
}

export function inventoryStatus(pct: number): Status {
  if (pct >= 60) return "online";
  if (pct >= 25) return "warning";
  return "critical";
}

/** Format a number with grouping (1234 -> "1,234"). */
export function fmt(n: number): string {
  return n.toLocaleString("en-US");
}
