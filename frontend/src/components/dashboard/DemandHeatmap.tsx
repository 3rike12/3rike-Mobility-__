import { STATUS } from "@/lib/utils";
import { type HeatNode } from "@/lib/data";
import { HeatBubble } from "./HeatBubble";

const LEGEND: { label: string; status: keyof typeof STATUS }[] = [
  { label: "Normal", status: "online" },
  { label: "Warning", status: "warning" },
  { label: "Critical", status: "critical" },
];

export function DemandHeatmap({ nodes }: { nodes: HeatNode[] }) {
  return (
    <div className="relative h-[360px] w-full overflow-hidden rounded-xl border border-border grid-plane">
      {/* green-tinted depth wash */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 30% 20%, rgba(1,194,89,0.12), transparent 55%), radial-gradient(90% 80% at 80% 90%, rgba(1,194,89,0.06), transparent 60%)",
        }}
      />

      {nodes.map((node, i) => (
        <HeatBubble key={node.name} node={node} index={i} />
      ))}

      {/* legend */}
      <div className="absolute bottom-3 left-4 flex items-center gap-4 rounded-full border border-border bg-bg/70 px-3.5 py-1.5 backdrop-blur-sm">
        {LEGEND.map((l) => (
          <span key={l.label} className="flex items-center gap-1.5 text-[11px] text-muted">
            <span
              className="size-2 rounded-full"
              style={{ background: STATUS[l.status].solid, boxShadow: `0 0 8px ${STATUS[l.status].glow}` }}
            />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
