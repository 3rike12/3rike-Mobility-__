import Link from "next/link";
import { Truck, TriangleAlert } from "lucide-react";
import { fmt } from "@/lib/utils";
import type { Summary } from "@/lib/api";

type SummaryItem = {
  label: string;
  value: string;
  sub: string;
  tone: "default" | "critical" | "warning";
};

const TONE = {
  default: { wrap: "border-border bg-surface-2/50", value: "text-text", sub: "text-green" },
  critical: { wrap: "border-critical/25 bg-[rgba(239,68,68,0.06)]", value: "text-critical", sub: "text-critical/90" },
  warning: { wrap: "border-warning/25 bg-[rgba(241,176,88,0.06)]", value: "text-warning", sub: "text-warning/90" },
} as const;

export function NetworkSummary({ summary: n }: { summary: Summary }) {
  const items: SummaryItem[] = [
    { label: "Total Stations", value: String(n.totalStations), sub: `${n.online} online`, tone: "default" },
    { label: "Total Inventory", value: fmt(n.totalInventory), sub: `/${fmt(n.totalCapacity)}`, tone: "default" },
    { label: "Critical Stations", value: String(n.critical), sub: "need attention", tone: "critical" },
    { label: "Warning Stations", value: String(n.warning), sub: "low inventory", tone: "warning" },
  ];
  return (
    <div
      className="animate-fade-up rounded-2xl border border-border bg-surface p-5 sm:p-6"
      style={{ animationDelay: "200ms" }}
    >
      <h2 className="text-lg font-semibold tracking-tight text-text">Network Summary</h2>

      <div className="mt-4 space-y-3">
        {items.map((it) => {
          const t = TONE[it.tone];
          const subDefault = it.label === "Total Inventory";
          return (
            <div key={it.label} className={`rounded-xl border p-4 ${t.wrap}`}>
              <div className="micro-label">{it.label}</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-[28px] font-bold leading-none tabular ${t.value}`}>
                  {it.value}
                </span>
                <span className={`text-[13px] font-medium ${subDefault ? "text-faint" : t.sub}`}>
                  {it.sub}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <h3 className="mt-6 text-[13px] font-semibold text-muted">Quick Actions</h3>
      <div className="mt-3 space-y-2.5">
        <Link
          href="/redistribution"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-green px-4 py-2.5 text-sm font-semibold text-[#06210f] shadow-[0_0_20px_rgba(1,194,89,0.3)] transition-all duration-200 hover:bg-green-hover hover:shadow-[0_0_28px_rgba(1,194,89,0.45)] active:scale-[0.98]"
        >
          <Truck className="size-[18px]" />
          Schedule Redistribution
        </Link>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm font-medium text-text transition-colors hover:border-hairline hover:bg-surface-3"
        >
          <TriangleAlert className="size-[18px] text-warning" />
          View All Alerts
        </button>
      </div>
    </div>
  );
}
