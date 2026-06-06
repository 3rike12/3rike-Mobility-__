import { cn, STATUS, type Status } from "@/lib/utils";

/** Glowing status dot, optionally pulsing for live/critical states. */
export function StatusDot({
  status,
  pulse,
  size = 8,
}: {
  status: Status;
  pulse?: boolean;
  size?: number;
}) {
  const s = STATUS[status];
  return (
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      {pulse && (
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background: s.solid,
            animation: "breathe 2s ease-in-out infinite",
            opacity: 0.6,
          }}
        />
      )}
      <span
        className="relative inline-block rounded-full"
        style={{
          width: size,
          height: size,
          background: s.solid,
          boxShadow: `0 0 10px ${s.glow}`,
        }}
      />
    </span>
  );
}

/** Pill badge in the status color. */
export function StatusBadge({
  status,
  label,
  className,
}: {
  status: Status;
  label?: string;
  className?: string;
}) {
  const s = STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        s.chip,
        className
      )}
    >
      {label ?? s.label}
    </span>
  );
}
