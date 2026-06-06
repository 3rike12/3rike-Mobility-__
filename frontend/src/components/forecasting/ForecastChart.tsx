import {
  predictedSeries,
  actualSeries,
  forecastHours,
  forecastMax,
  nowIndex,
  riskRange,
} from "@/lib/data";

const W = 820;
const H = 340;
const padL = 40;
const padR = 14;
const padT = 18;
const padB = 30;
const plotW = W - padL - padR;
const plotH = H - padT - padB;
const lastIndex = predictedSeries.length - 1;

type Pt = { x: number; y: number };

const xAt = (i: number) => padL + (i / lastIndex) * plotW;
const yAt = (v: number) => padT + (1 - v / forecastMax) * plotH;

function toPts(series: number[]): Pt[] {
  return series.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
}

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

export function ForecastChart() {
  const predPts = toPts(predictedSeries);
  const actPts = toPts(actualSeries);
  const predPath = smooth(predPts);
  const actPath = smooth(actPts);
  const areaPath = `${predPath} L ${xAt(lastIndex)},${yAt(0)} L ${xAt(0)},${yAt(0)} Z`;

  const yTicks = [0, 200, 400, 600, 800];
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
      {yTicks.map((t) => (
        <g key={t}>
          <line
            x1={padL}
            x2={W - padR}
            y1={yAt(t)}
            y2={yAt(t)}
            stroke="var(--color-line)"
            vectorEffect="non-scaling-stroke"
          />
          <text x={padL - 8} y={yAt(t) + 3.5} textAnchor="end" fontSize="11" fill="var(--color-faint)">
            {t}
          </text>
        </g>
      ))}

      {/* shortage risk band */}
      <rect
        x={xAt(riskRange[0])}
        y={padT}
        width={xAt(riskRange[1]) - xAt(riskRange[0])}
        height={plotH}
        fill="rgba(239,68,68,0.13)"
      />
      <line
        x1={xAt(riskRange[0])}
        x2={xAt(riskRange[0])}
        y1={padT}
        y2={padT + plotH}
        stroke="rgba(239,68,68,0.4)"
        strokeDasharray="3 3"
        vectorEffect="non-scaling-stroke"
      />
      <text
        x={(xAt(riskRange[0]) + xAt(riskRange[1])) / 2}
        y={padT + 16}
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        letterSpacing="1"
        fill="#f87171"
      >
        RISK
      </text>

      {/* x labels */}
      {forecastHours.map((label, i) =>
        label ? (
          <text key={i} x={xAt(i)} y={H - 10} textAnchor="middle" fontSize="11" fill="var(--color-faint)">
            {label}
          </text>
        ) : null
      )}

      {/* now marker */}
      <line
        x1={xAt(nowIndex)}
        x2={xAt(nowIndex)}
        y1={padT}
        y2={padT + plotH}
        stroke="var(--color-line-strong)"
        strokeDasharray="4 4"
        vectorEffect="non-scaling-stroke"
      />
      <text x={xAt(nowIndex)} y={padT - 5} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--color-muted)">
        Now
      </text>

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
        style={{
          strokeDasharray: 2200,
          strokeDashoffset: 2200,
          animation: "draw 1.9s var(--ease-out-soft) forwards",
        }}
      />

      {/* actual line */}
      <path
        d={actPath}
        fill="none"
        stroke="#7bcd8a"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="2 6"
        vectorEffect="non-scaling-stroke"
        style={{
          strokeDashoffset: 1400,
          animation: "draw 1.6s var(--ease-out-soft) forwards",
        }}
      />

      {/* now point */}
      {lastActual && (
        <g className="animate-fade-in" style={{ animationDelay: "1500ms" }}>
          <circle cx={lastActual.x} cy={lastActual.y} r="9" fill="rgba(123,205,138,0.25)">
            <animate attributeName="r" values="6;11;6" dur="2.2s" repeatCount="indefinite" />
          </circle>
          <circle cx={lastActual.x} cy={lastActual.y} r="4" fill="#7bcd8a" stroke="#0a0f0c" strokeWidth="1.5" />
        </g>
      )}
    </svg>
  );
}
