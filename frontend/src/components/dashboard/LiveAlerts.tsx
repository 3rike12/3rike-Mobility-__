import { ChevronRight } from "lucide-react";
import { STATUS } from "@/lib/utils";
import { StatusDot } from "@/components/ui/Status";
import { type Alert } from "@/lib/data";

const TINT: Record<string, string> = {
  critical: "rgba(239,68,68,0.05)",
  warning: "rgba(241,176,88,0.05)",
  online: "transparent",
  offline: "transparent",
};

function AlertRow({ alert, index }: { alert: Alert; index: number }) {
  const s = STATUS[alert.status];
  return (
    <div
      className="group relative animate-fade-up overflow-hidden rounded-xl border border-border p-3.5 pl-4 transition-colors hover:border-hairline"
      style={{ background: TINT[alert.status], animationDelay: `${150 + index * 80}ms` }}
    >
      <span className="absolute left-0 top-0 h-full w-[3px]" style={{ background: s.solid }} />
      <div className="flex items-center gap-2">
        <StatusDot status={alert.status} pulse={alert.status === "critical"} />
        <span className="text-sm font-semibold text-text">{alert.station}</span>
        <span className="text-sm font-semibold" style={{ color: s.solid }}>
          · {s.label}
        </span>
        <ChevronRight className="ml-auto size-4 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <p className="mt-1.5 text-[13px] leading-snug text-muted">{alert.message}</p>
      <p className="mt-1.5 font-mono text-[11px] text-faint">{alert.time}</p>
    </div>
  );
}

export function LiveAlerts({ alerts }: { alerts: Alert[] }) {
  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2.5">
        {alerts.map((a, i) => (
          <AlertRow key={a.station} alert={a} index={i} />
        ))}
      </div>
      <div className="flex-1" />
      <button
        type="button"
        className="mt-4 w-full rounded-xl border border-border bg-surface-2/50 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-text"
      >
        View all alerts
      </button>
    </div>
  );
}
