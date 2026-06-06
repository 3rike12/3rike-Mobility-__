import { Icon, ACCENT } from "@/components/ui/Icon";
import type { Insight } from "@/lib/data";

export function InsightCard({ insight, index = 0 }: { insight: Insight; index?: number }) {
  const a = ACCENT[insight.accent];
  return (
    <div
      style={{ animationDelay: `${index * 80}ms` }}
      className="animate-fade-up rounded-2xl border border-border bg-surface p-5 card-hover"
    >
      <div className="flex items-center gap-2.5">
        <span
          className="grid size-9 place-items-center rounded-xl"
          style={{ background: a.bg, color: a.color }}
        >
          <Icon name={insight.icon} className="size-[18px]" strokeWidth={2.2} />
        </span>
        <h3 className="font-semibold tracking-tight text-text">{insight.title}</h3>
      </div>
      <p className="mt-3.5 text-[13px] leading-relaxed text-muted">{insight.body}</p>
    </div>
  );
}
