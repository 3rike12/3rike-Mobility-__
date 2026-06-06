import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Icon, ACCENT, type AccentKey } from "./Icon";
import type { Stat } from "@/lib/data";

export function StatCard({ stat, index = 0 }: { stat: Stat; index?: number }) {
  const tone = stat.tone ?? "default";
  const accent = (stat.accent ?? "green") as AccentKey;
  const a = ACCENT[accent];

  const toneClasses =
    tone === "critical"
      ? "border-critical/35 bg-[linear-gradient(180deg,rgba(239,68,68,0.08),rgba(239,68,68,0.02))]"
      : tone === "hero"
        ? "border-green/30 bg-[linear-gradient(180deg,rgba(1,194,89,0.12),rgba(1,194,89,0.02))]"
        : "border-border bg-surface";

  const valueClass =
    tone === "critical"
      ? "text-critical"
      : tone === "hero"
        ? "text-green text-glow-green"
        : "text-text";

  return (
    <div
      style={{ animationDelay: `${index * 70}ms` }}
      className={cn(
        "group relative animate-fade-up overflow-hidden rounded-2xl border p-5 card-hover",
        toneClasses
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="micro-label">{stat.label}</span>
        <span
          className="grid size-9 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110"
          style={{ background: a.bg, color: a.color }}
        >
          <Icon name={stat.icon} className="size-[18px]" strokeWidth={2.2} />
        </span>
      </div>

      <div className="mt-4 flex items-baseline gap-1.5">
        <span className={cn("text-[2.1rem] font-bold leading-none tracking-tight tabular", valueClass)}>
          {stat.value}
        </span>
        {stat.unit && (
          <span className="text-base font-medium text-muted">{stat.unit}</span>
        )}
      </div>

      <div className="mt-3 min-h-5 text-[13px]">
        {stat.trend ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 font-medium",
              tone === "critical" ? "text-critical" : "text-green"
            )}
          >
            {stat.trend.dir === "down" ? (
              <ArrowDownRight className="size-3.5" />
            ) : (
              <ArrowUpRight className="size-3.5" />
            )}
            {stat.trend.value}
          </span>
        ) : (
          <span className={cn(tone === "critical" ? "text-critical/90" : "text-muted")}>
            {stat.sub}
          </span>
        )}
      </div>

      {/* subtle corner glow for emphasis cards */}
      {tone !== "default" && (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full blur-2xl"
          style={{
            background: tone === "critical" ? "rgba(239,68,68,0.18)" : "rgba(1,194,89,0.2)",
          }}
        />
      )}
    </div>
  );
}
