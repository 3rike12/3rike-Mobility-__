import { cn, STATUS, type Status } from "@/lib/utils";
import { StatusDot, StatusBadge } from "@/components/ui/Status";
import { InventoryBar } from "@/components/ui/InventoryBar";
import type { Station } from "@/lib/data";

function valueColor(status: Status): string {
  if (status === "critical") return "text-critical";
  if (status === "warning") return "text-warning";
  if (status === "offline") return "text-faint";
  return "text-text";
}

function Metric({
  label,
  value,
  suffix,
  className,
}: {
  label: string;
  value: React.ReactNode;
  suffix?: string;
  className?: string;
}) {
  return (
    <div>
      <div className="micro-label">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className={cn("text-[22px] font-bold leading-none tabular", className)}>
          {value}
        </span>
        {suffix && <span className="text-[13px] text-faint">{suffix}</span>}
      </div>
    </div>
  );
}

export function StationCard({ station, index = 0 }: { station: Station; index?: number }) {
  const offline = station.status === "offline";
  const pct = station.inventory != null ? (station.inventory / station.capacity) * 100 : 0;

  return (
    <div
      style={{ animationDelay: `${index * 60}ms` }}
      className="group animate-fade-up rounded-2xl border border-border bg-surface p-5 card-hover"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <StatusDot status={station.status} pulse={station.status === "critical"} />
          <h3 className="font-semibold tracking-tight text-text">{station.name}</h3>
        </div>
        <StatusBadge status={station.status} />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <Metric
          label="Inventory"
          value={station.inventory ?? "--"}
          suffix={`/${station.capacity}`}
          className={valueColor(station.status)}
        />
        <Metric label="Swaps Today" value={station.swaps ?? "--"} className="text-text" />
        <Metric
          label={offline ? "Last Online" : "Est. Empty"}
          value={offline ? station.lastOnline ?? "--" : station.estEmpty}
          className={offline ? "text-text" : valueColor(station.status)}
        />
      </div>

      <div className="mt-5">
        <InventoryBar
          pct={pct}
          color={offline ? STATUS.offline.solid : undefined}
          delay={index * 60 + 200}
        />
      </div>
    </div>
  );
}
