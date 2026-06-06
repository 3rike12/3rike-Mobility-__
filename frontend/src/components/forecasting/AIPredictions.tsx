import { TriangleAlert, Clock, TrendingUp, type LucideIcon } from "lucide-react";
import { STATUS } from "@/lib/utils";
import { type Prediction } from "@/lib/data";

const TAG_ICON: Record<Prediction["tagKind"], LucideIcon> = {
  critical: TriangleAlert,
  time: Clock,
  surplus: TrendingUp,
};

const TINT: Record<string, string> = {
  critical: "rgba(239,68,68,0.06)",
  warning: "rgba(241,176,88,0.05)",
  online: "rgba(1,194,89,0.05)",
  offline: "transparent",
};

function PredictionRow({ p, index }: { p: Prediction; index: number }) {
  const color = STATUS[p.status].solid;
  const TagIcon = TAG_ICON[p.tagKind];
  return (
    <div
      className="relative animate-fade-up overflow-hidden rounded-xl border border-border p-4 pl-[18px] transition-colors hover:border-hairline"
      style={{ background: TINT[p.status], animationDelay: `${120 + Math.min(index, 7) * 70}ms` }}
    >
      <span className="absolute left-0 top-0 h-full w-[3px]" style={{ background: color }} />
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold tracking-tight text-text">{p.station}</h3>
        <span className="inline-flex items-center gap-1 text-[13px] font-semibold" style={{ color }}>
          <TagIcon className="size-3.5" />
          {p.tag}
        </span>
      </div>
      <p className="mt-1.5 text-[13px] text-muted">{p.note}</p>
      <p className="mt-1 text-[13px] font-medium" style={{ color }}>
        <span className="opacity-70">Recommend:</span> {p.recommend}
      </p>
    </div>
  );
}

export function AIPredictions({ predictions }: { predictions: Prediction[] }) {
  return (
    <div className="-mr-2 max-h-[480px] space-y-2.5 overflow-y-auto pr-2 lg:max-h-[clamp(420px,52vh,640px)]">
      {predictions.map((p, i) => (
        <PredictionRow key={p.station} p={p} index={i} />
      ))}
    </div>
  );
}
