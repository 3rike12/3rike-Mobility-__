import { inventoryColor } from "@/lib/utils";

/** Thin inventory progress bar; fill color follows the threshold rule. */
export function InventoryBar({
  pct,
  color,
  delay = 0,
}: {
  pct: number;
  color?: string;
  delay?: number;
}) {
  const fill = color ?? inventoryColor(pct);
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
      <div
        className="h-full rounded-full"
        style={{
          width: `${clamped}%`,
          background: fill,
          boxShadow: `0 0 10px ${fill}55`,
          transformOrigin: "left",
          animation: `grow-x 0.9s var(--ease-out-soft) ${delay}ms both`,
        }}
      />
    </div>
  );
}
