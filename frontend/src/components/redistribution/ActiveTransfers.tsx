import { cn } from "@/lib/utils";
import { type Transfer } from "@/lib/data";

function TransferRow({ t, index }: { t: Transfer; index: number }) {
  const inTransit = t.status === "In Transit";
  return (
    <div
      className={cn(
        "animate-fade-up rounded-xl border p-4 transition-colors",
        inTransit
          ? "border-border bg-surface-2/50 hover:border-hairline"
          : "border-warning/25 bg-[rgba(241,176,88,0.05)]"
      )}
      style={{ animationDelay: `${150 + index * 80}ms` }}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-tight text-text">
          <span className="font-mono text-muted">{t.id}:</span> {t.route}
        </h3>
        <span
          className={cn(
            "inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[11px] font-semibold",
            inTransit ? "bg-[rgba(90,169,255,0.13)] text-info" : "chip-warning"
          )}
        >
          {t.status}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-[13px] text-muted">
        <span className="tabular">{t.batteries} batteries</span>
        <span className="text-faint">·</span>
        <span className={cn("font-mono", inTransit ? "text-info" : "text-warning")}>{t.detail}</span>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-track">
        <div
          className="h-full rounded-full"
          style={{
            width: `${t.progress}%`,
            background: inTransit ? "#5aa9ff" : "transparent",
            boxShadow: inTransit ? "0 0 10px rgba(90,169,255,0.5)" : undefined,
            transformOrigin: "left",
            animation: `grow-x 0.9s var(--ease-out-soft) ${index * 80 + 200}ms both`,
          }}
        />
      </div>
    </div>
  );
}

export function ActiveTransfers({ transfers }: { transfers: Transfer[] }) {
  return (
    <div className="space-y-2.5">
      {transfers.map((t, i) => (
        <TransferRow key={t.id} t={t} index={i} />
      ))}
    </div>
  );
}
