import type { ChartSeries } from "@/lib/data";

const W = 820;
const H = 340;
const padL = 40;
const padR = 14;
const padT = 18;
const padB = 30;
const plotW = W - padL - padR;
const plotH = H - padT - padB;

type Pt = { x: number; y: number };

/** Catmull-Rom → cubic bezier for a smooth line. */
function smooth(pts: Pt[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
  }
  return d;
}

/** Round up to a clean axis ceiling (50, 100, 250, …). */
function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / mag;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * mag;
}

function hourLabel(iso: string): string {
  const d = new Date(iso);
  let h = d.getUTCHours();
  const ampm = h < 12 ? "AM" : "PM";
  h = h % 12 || 12;
  return `${h}${ampm}`;
}

export function ForecastChart({ series }: { series: ChartSeries }) {
  const pts = series.points ?? [];
  if (pts.length < 2) {
    return (
      <div className="grid h-[260px] w-full place-items-center text-sm text-muted">
        No forecast data available.
      </div>
    );
  }

  const times = pts.map((p) => Date.parse(p.t));
  const t0 = times[0];
  const span = (times[times.length - 1] - t0) || 1;
  // Scale to the data's own peak (with headroom) so the line always fills the
  // plane — the backend's unitMax can be far larger than the actual values.
  const dataMax = Math.max(0, ...pts.map((p) => Math.max(p.predicted, p.actual ?? 0)));
  const maxV = dataMax > 0 ? niceCeil(dataMax * 1.05) : series.unitMax > 0 ? series.unitMax : 1;

  const xOf = (ms: number) => padL + (Math.max(0, Math.min(1, (ms - t0) / span))) * plotW;
  const yOf = (v: number) => padT + (1 - v / maxV) * plotH;

  const predPts: Pt[] = pts.map((p, i) => ({ x: xOf(times[i]), y: yOf(p.predicted) }));
  const actPts: Pt[] = pts
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.actual != null)
    .map(({ p, i }) => ({ x: xOf(times[i]), y: yOf(p.actual as number) }));

  const predPath = smooth(predPts);
  const actPath = smooth(actPts);
  const areaPath = `${predPath} L ${xOf(times[times.length - 1])},${yOf(0)} L ${xOf(t0)},${yOf(0)} Z`;

  const nowX = xOf(Date.parse(series.nowAt));
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxV * f));
  const labelStep = Math.max(1, Math.round(pts.length / 7));
  const lastActual = actPts[actPts.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="Network demand forecast">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#01c259" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#01c259" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* horizontal gridlines + y labels */}
      {yTicks.map((t, idx) => (
        <g key={idx}>
          <line x1={padL} x2={W - padR} y1={yOf(t)} y2={yOf(t)} stroke="var(--color-line)" vectorEffect="non-scaling-stroke" />
          <text x={padL - 8} y={yOf(t) + 3.5} textAnchor="end" fontSize="11" fill="var(--color-faint)">
            {t}
          </text>
        </g>
      ))}

      {/* shortage risk bands */}
      {series.riskWindows?.map((w, i) => {
        const x1 = xOf(Date.parse(w.startAt));
        const x2 = xOf(Date.parse(w.endAt));
        const fill = w.severity === "warning" ? "rgba(241,176,88,0.13)" : "rgba(239,68,68,0.13)";
        const stroke = w.severity === "warning" ? "rgba(241,176,88,0.4)" : "rgba(239,68,68,0.4)";
        const label = w.severity === "warning" ? "#f1b058" : "#f87171";
        return (
          <g key={`risk-${i}`}>
            <rect x={x1} y={padT} width={Math.max(0, x2 - x1)} height={plotH} fill={fill} />
            <line x1={x1} x2={x1} y1={padT} y2={padT + plotH} stroke={stroke} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
            <text x={(x1 + x2) / 2} y={padT + 16} textAnchor="middle" fontSize="11" fontWeight="700" letterSpacing="1" fill={label}>
              RISK
            </text>
          </g>
        );
      })}

      {/* x labels */}
      {pts.map((p, i) =>
        i % labelStep === 0 ? (
          <text key={`xl-${i}`} x={xOf(times[i])} y={H - 10} textAnchor="middle" fontSize="11" fill="var(--color-faint)">
            {hourLabel(p.t)}
          </text>
        ) : null
      )}

      {/* now marker */}
      {nowX >= padL && nowX <= W - padR && (
        <>
          <line x1={nowX} x2={nowX} y1={padT} y2={padT + plotH} stroke="var(--color-line-strong)" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
          <text x={nowX} y={padT - 5} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--color-muted)">
            Now
          </text>
        </>
      )}

      {/* area under predicted */}
      <path d={areaPath} fill="url(#areaFill)" className="animate-fade-in" style={{ animationDelay: "900ms" }} />

      {/* predicted line */}
      <path
        d={predPath}
        fill="none"
        stroke="#01c259"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        style={{ strokeDasharray: 2200, strokeDashoffset: 2200, animation: "draw 1.9s var(--ease-out-soft) forwards" }}
      />

      {/* actual line */}
      {actPts.length >= 2 && (
        <path
          d={actPath}
          fill="none"
          stroke="#7bcd8a"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="2 6"
          vectorEffect="non-scaling-stroke"
          style={{ strokeDashoffset: 1400, animation: "draw 1.6s var(--ease-out-soft) forwards" }}
        />
      )}

      {/* now point */}
      {lastActual && (
        <g className="animate-fade-in" style={{ animationDelay: "1500ms" }}>
          <circle cx={lastActual.x} cy={lastActual.y} r="9" fill="rgba(123,205,138,0.25)">
            <animate attributeName="r" values="6;11;6" dur="2.2s" repeatCount="indefinite" />
          </circle>
          <circle cx={lastActual.x} cy={lastActual.y} r="4" fill="#7bcd8a" stroke="var(--color-bg)" strokeWidth="1.5" />
        </g>
      )}
    </svg>
  );
}
