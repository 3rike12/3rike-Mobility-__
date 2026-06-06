import { mapNodes, routeLines, vehicles, type MapNode } from "@/lib/data";

const COLORS = {
  source: "#01c259",
  destination: "#ef4444",
  vehicle: "#5aa9ff",
};

const byId = Object.fromEntries(mapNodes.map((n) => [n.id, n]));

function Node({ node, index }: { node: MapNode; index: number }) {
  const color = COLORS[node.kind];
  const top = node.kind === "source";
  return (
    <div
      className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 animate-pop"
      style={{ left: `${node.x}%`, top: `${node.y}%`, animationDelay: `${400 + index * 70}ms` }}
    >
      {top && (
        <span
          className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 whitespace-nowrap text-[12px] font-semibold"
          style={{ color }}
        >
          {node.label}
        </span>
      )}
      <span
        className="absolute left-1/2 top-1/2 size-9 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: `radial-gradient(circle, ${color}88 0%, transparent 70%)` }}
      />
      <span
        className="relative block size-4 rounded-full ring-2 ring-white/85 transition-transform duration-300 group-hover:scale-125"
        style={{ background: color, boxShadow: `0 0 16px ${color}` }}
      />
      {!top && (
        <span
          className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 whitespace-nowrap text-[12px] font-semibold"
          style={{ color }}
        >
          {node.label}
        </span>
      )}
    </div>
  );
}

export function RouteMap() {
  return (
    <div className="relative h-[300px] w-full overflow-hidden rounded-xl border border-border grid-plane sm:h-[420px]">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 30%, rgba(1,194,89,0.1), transparent 55%)",
        }}
      />

      {/* routes */}
      <svg
        className="absolute inset-0 size-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        {routeLines.map((r, i) => {
          const a = byId[r.from];
          const b = byId[r.to];
          if (!a || !b) return null;
          return (
            <g key={i}>
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#01c259"
                strokeWidth="5"
                strokeOpacity="0.12"
                vectorEffect="non-scaling-stroke"
              />
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#01c259"
                strokeWidth="1.6"
                strokeDasharray="5 4"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                style={{ animation: "dash-flow 18s linear infinite" }}
              />
            </g>
          );
        })}
      </svg>

      {/* destination + source nodes */}
      {mapNodes.map((n, i) => (
        <Node key={n.id} node={n} index={i} />
      ))}

      {/* vehicles */}
      {vehicles.map((v, i) => (
        <div
          key={v.id}
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2 animate-pop"
          style={{ left: `${v.x}%`, top: `${v.y}%`, animationDelay: `${700 + i * 120}ms` }}
        >
          <span
            className="absolute left-1/2 top-1/2 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: `radial-gradient(circle, ${COLORS.vehicle}99 0%, transparent 70%)`,
              animation: "breathe 2.6s ease-in-out infinite",
            }}
          />
          <span
            className="relative block size-3.5 rounded-full ring-2 ring-white/85"
            style={{ background: COLORS.vehicle, boxShadow: `0 0 14px ${COLORS.vehicle}` }}
          />
          <span className="absolute top-[calc(100%+6px)] left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[11px] text-faint">
            {v.label} ({v.units})
          </span>
        </div>
      ))}

      {/* legend */}
      <div className="absolute bottom-3 left-4 flex items-center gap-4 rounded-full border border-border bg-bg/70 px-3.5 py-1.5 backdrop-blur-sm">
        {[
          { label: "Source", color: COLORS.source },
          { label: "Destination", color: COLORS.destination },
          { label: "Vehicle", color: COLORS.vehicle },
        ].map((l) => (
          <span key={l.label} className="flex items-center gap-1.5 text-[11px] text-muted">
            <span
              className="size-2 rounded-full"
              style={{ background: l.color, boxShadow: `0 0 8px ${l.color}` }}
            />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
