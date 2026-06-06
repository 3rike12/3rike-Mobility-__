import { STATUS } from "@/lib/utils";
import { heatNodes, type HeatNode } from "@/lib/data";

function Bubble({ node, index }: { node: HeatNode; index: number }) {
  const s = STATUS[node.status];
  const core = 16 + (node.demand / 100) * 30; // ~21..46px
  const halo = core * 2.6;
  const critical = node.status === "critical";

  return (
    <div
      className="group absolute -translate-x-1/2 -translate-y-1/2 animate-pop"
      style={{ left: `${node.x}%`, top: `${node.y}%`, animationDelay: `${300 + index * 80}ms` }}
    >
      {/* halo */}
      <span
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: halo,
          height: halo,
          background: `radial-gradient(circle, ${s.glow} 0%, transparent 68%)`,
          opacity: critical ? 0.9 : 0.6,
          animation: critical ? "breathe 2.4s ease-in-out infinite" : undefined,
        }}
      />
      {/* core */}
      <span
        className="relative block rounded-full ring-2 ring-white/85 transition-transform duration-300 group-hover:scale-110"
        style={{
          width: core,
          height: core,
          background: s.solid,
          boxShadow: `0 0 18px ${s.glow}`,
        }}
      />
      {/* tooltip */}
      <div className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-surface-3 px-2.5 py-1.5 text-center opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100">
        <div className="text-[12px] font-semibold text-text">{node.name}</div>
        <div className="text-[11px]" style={{ color: s.solid }}>
          {node.demand}% demand · {s.label}
        </div>
      </div>
    </div>
  );
}

const LEGEND: { label: string; status: keyof typeof STATUS }[] = [
  { label: "Normal", status: "online" },
  { label: "Warning", status: "warning" },
  { label: "Critical", status: "critical" },
];

export function DemandHeatmap() {
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

      {heatNodes.map((node, i) => (
        <Bubble key={node.name} node={node} index={i} />
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
