import { fmt, type Status } from "./utils";
import {
  type Stat,
  type HeatNode,
  type Alert,
  type Station,
  type Prediction,
  type Insight,
  type MapNode,
  type RouteLine,
  type Vehicle,
  type Transfer,
  type ChartSeries,
  // fallbacks (used if the API is unreachable so the demo never breaks)
  dashboardStats,
  dashboardSecondaryStats,
  heatNodes,
  liveAlerts,
  stations as mockStations,
  networkSummary,
  forecastStats,
  mockForecastSeries,
  predictions as mockPredictions,
  insights as mockInsights,
  redistributionStats,
  mapNodes,
  routeLines,
  vehicles as mockVehicles,
  transfers as mockTransfers,
} from "./data";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://3.213.111.199:8000";

export type Summary = {
  totalStations: number;
  online: number;
  totalInventory: number;
  totalCapacity: number;
  critical: number;
  warning: number;
};

export type Settings = {
  organization: { name: string; region: string; currency: string; timezone: string };
  thresholds: {
    criticalBelowPct: number;
    warningBelowPct: number;
    autoGenerateAlerts: boolean;
    predictiveWarnings: boolean;
  };
  ai: { forecastHorizon: string; autoRedistributeSurplus: boolean; weatherAdjusted: boolean };
  notifications: {
    criticalAlerts: boolean;
    dailyDigest: boolean;
    smsFieldTeam: boolean;
    weeklyReport: boolean;
  };
};

/* ---------------- low-level fetch ---------------- */

async function apiGet<T>(path: string): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      cache: "no-store",
      signal: ctrl.signal,
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`${path} → ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

/* ---------------- formatting helpers ---------------- */

function relativeTime(iso: string | null): string {
  if (!iso) return "--";
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "--";
  const mins = Math.round((Date.now() - ms) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function estEmpty(minutes: number | null): string {
  if (minutes == null) return "--";
  if (minutes < 60) return `${Math.round(minutes)}m`;
  return `${(minutes / 60).toFixed(1)}h`;
}

function etaLabel(iso: string | null): string {
  if (!iso) return "--";
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "--";
  const m = Math.max(0, Math.round((ms - Date.now()) / 60000));
  return m < 60 ? `${m} min` : `${(m / 60).toFixed(1)}h`;
}

function clock(iso: string | null): string {
  if (!iso) return "--";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--";
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h < 12 ? "AM" : "PM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

function countdown(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function money(value: number, currency: string): string {
  const sym = currency === "NGN" ? "₦" : currency === "USD" ? "$" : currency === "GHS" ? "₵" : "";
  const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
  return `${sym}${compact}`;
}

function signed(n: number): string {
  return `${n >= 0 ? "+" : ""}${n}`;
}

function kindToStatus(kind: string): Status {
  if (kind === "critical") return "critical";
  if (kind === "time") return "warning";
  return "online";
}

/** Deterministic jittered scatter across the plane (heatmap is abstract, and the
 *  backend coords cluster — a balanced scatter reads far better). */
function scatter(i: number, n: number): { x: number; y: number } {
  const cols = Math.max(1, Math.ceil(Math.sqrt(n)));
  const rows = Math.max(1, Math.ceil(n / cols));
  const col = i % cols;
  const row = Math.floor(i / cols);
  const jx = (((i * 37) % 100) / 100) * 10 - 5;
  const jy = (((i * 61) % 100) / 100) * 10 - 5;
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  return {
    x: clamp(14 + ((col + 0.5) / cols) * 72 + jx, 12, 88),
    y: clamp(16 + ((row + 0.5) / rows) * 66 + jy, 14, 86),
  };
}

/** Rescale an arbitrary coordinate set into a padded 0–100 plane. */
function rescaler(pts: { x: number; y: number }[]) {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const pad = 12;
  const sc = (v: number, mn: number, mx: number) =>
    mx === mn ? 50 : pad + ((v - mn) / (mx - mn)) * (100 - 2 * pad);
  return (p: { x: number; y: number }) => ({ x: sc(p.x, minX, maxX), y: sc(p.y, minY, maxY) });
}

/* ---------------- raw API shapes ---------------- */

type ApiOverview = {
  totalBatteries: { value: number; deltaWeek: number };
  activeSwapsToday: { value: number; deltaPctVsYesterday: number };
  stationsOnline: { online: number; total: number; needAttention: number };
  shortageAlerts: { total: number; critical: number; warning: number };
  avgSwapTimeMin: { value: number; deltaPct: number };
  fleetUtilizationPct: { value: number; deltaVsTarget: number };
  predictionAccuracyPct: { value: number; modelVersion: string };
  revenueToday: { value: number; currency: string; deltaPctVsForecast: number };
};

/* ---------------- adapters ---------------- */

function overviewToStats(o: ApiOverview): { top: Stat[]; secondary: Stat[] } {
  return {
    top: [
      { label: "Total Batteries", value: fmt(o.totalBatteries.value), icon: "battery", accent: "green",
        trend: { value: `${signed(o.totalBatteries.deltaWeek)} this week`, dir: o.totalBatteries.deltaWeek < 0 ? "down" : "up", negative: o.totalBatteries.deltaWeek < 0 } },
      { label: "Active Swaps Today", value: fmt(o.activeSwapsToday.value), icon: "zap", accent: "info",
        trend: { value: `${signed(o.activeSwapsToday.deltaPctVsYesterday)}% vs yesterday`, dir: o.activeSwapsToday.deltaPctVsYesterday < 0 ? "down" : "up", negative: o.activeSwapsToday.deltaPctVsYesterday < 0 } },
      { label: "Stations Online", value: String(o.stationsOnline.online), unit: `/${o.stationsOnline.total}`, sub: `${o.stationsOnline.needAttention} stations need attention`, icon: "mapPinned", accent: "purple" },
      { label: "Shortage Alerts", value: String(o.shortageAlerts.total), sub: `${o.shortageAlerts.critical} critical, ${o.shortageAlerts.warning} warning`, icon: "alert", accent: "critical", tone: "critical" },
    ],
    secondary: [
      { label: "Avg Swap Time", value: String(o.avgSwapTimeMin.value), unit: "min", icon: "timer", accent: "green",
        trend: { value: `${o.avgSwapTimeMin.deltaPct}% ${o.avgSwapTimeMin.deltaPct <= 0 ? "improved" : "slower"}`, dir: o.avgSwapTimeMin.deltaPct <= 0 ? "down" : "up", negative: o.avgSwapTimeMin.deltaPct > 0 } },
      { label: "Fleet Utilization", value: String(o.fleetUtilizationPct.value), unit: "%", icon: "gauge", accent: "green",
        trend: { value: `${signed(o.fleetUtilizationPct.deltaVsTarget)}% vs target`, dir: o.fleetUtilizationPct.deltaVsTarget < 0 ? "down" : "up", negative: o.fleetUtilizationPct.deltaVsTarget < 0 } },
      { label: "Prediction Accuracy", value: String(o.predictionAccuracyPct.value), unit: "%", sub: o.predictionAccuracyPct.modelVersion, icon: "target", accent: "green", tone: "hero" },
      { label: "Revenue Today", value: money(o.revenueToday.value, o.revenueToday.currency), icon: "wallet", accent: "green",
        trend: { value: `${signed(o.revenueToday.deltaPctVsForecast)}% vs forecast`, dir: o.revenueToday.deltaPctVsForecast < 0 ? "down" : "up", negative: o.revenueToday.deltaPctVsForecast < 0 } },
    ],
  };
}

/* ---------------- public loaders (fallback-safe) ---------------- */

export async function loadDashboard() {
  const [overview, heatmap, alerts] = await Promise.all([
    safe(() => apiGet<ApiOverview>("/dashboard/overview"), null),
    safe(() => apiGet<{ nodes: (HeatNode & { stationId: string })[] }>("/dashboard/heatmap?window=live"), null),
    safe(() => apiGet<{ total: number; items: { station: string; status: Status; message: string; createdAt: string }[] }>("/alerts?limit=6"), null),
  ]);

  const stats = overview ? overviewToStats(overview) : { top: dashboardStats, secondary: dashboardSecondaryStats };

  let nodes: HeatNode[];
  if (heatmap?.nodes?.length) {
    const list = [...heatmap.nodes].sort((a, b) => b.demand - a.demand).slice(0, 16);
    const maxD = Math.max(1, ...list.map((n) => n.demand));
    nodes = list.map((n, i) => ({
      name: n.name,
      ...scatter(i, list.length),
      demand: Math.round(30 + (n.demand / maxD) * 70),
      status: n.status,
    }));
  } else {
    nodes = heatNodes;
  }

  const alertList: Alert[] = alerts?.items
    ? alerts.items.map((a) => ({ station: a.station, status: a.status, message: a.message, time: relativeTime(a.createdAt) }))
    : liveAlerts;

  return { topStats: stats.top, secondaryStats: stats.secondary, heatNodes: nodes, alerts: alertList };
}

export async function loadStations(status?: string, q?: string) {
  const qs = new URLSearchParams();
  if (status && status !== "all") qs.set("status", status);
  if (q) qs.set("q", q);
  const data = await safe(
    () => apiGet<{ summary: Summary; items: (Station & { swapsToday: number | null; estEmptyMinutes: number | null; lastOnlineAt: string | null })[] }>(`/stations${qs.toString() ? `?${qs}` : ""}`),
    null
  );
  if (!data) return { stations: mockStations, summary: networkSummary };
  const stations: Station[] = data.items.map((s) => ({
    name: s.name,
    status: s.status,
    inventory: s.inventory,
    capacity: s.capacity,
    swaps: s.swapsToday,
    estEmpty: estEmpty(s.estEmptyMinutes),
    lastOnline: relativeTime(s.lastOnlineAt),
  }));
  return { stations, summary: data.summary };
}

export async function loadForecasting() {
  const [stats, series, preds, ins] = await Promise.all([
    safe(() => apiGet<{ modelAccuracyPct: number; modelVersion: string; predictionsToday: number; predictionsCorrectPct: number; shortagesPreventedThisWeek: number; nextUpdateInSeconds: number }>("/forecast/stats"), null),
    safe(() => apiGet<ChartSeries>("/forecast/series?horizon=24h&interval=1h"), null),
    safe(() => apiGet<{ items: { station: string; status: Status; kind: string; label: string; note: string; recommendation: { action: string; units: number | null } }[] }>("/forecast/predictions?horizon=6h"), null),
    safe(() => apiGet<{ items: { type: string; title: string; body: string }[] }>("/forecast/insights"), null),
  ]);

  const statCards: Stat[] = stats
    ? [
        { label: "Model Accuracy", value: String(stats.modelAccuracyPct), unit: "%", sub: stats.modelVersion, icon: "brain", accent: "green", tone: "hero" },
        { label: "Predictions Today", value: fmt(stats.predictionsToday), sub: `${stats.predictionsCorrectPct}% correct so far`, icon: "activity", accent: "info" },
        { label: "Shortages Prevented", value: String(stats.shortagesPreventedThisWeek), sub: "This week", icon: "shield", accent: "green" },
        { label: "Next Update", value: countdown(stats.nextUpdateInSeconds), sub: "minutes", icon: "refresh", accent: "purple" },
      ]
    : forecastStats;

  const predictions: Prediction[] = preds?.items
    ? preds.items.map((p) => ({
        station: p.station,
        status: kindToStatus(p.kind),
        tag: p.label,
        tagKind: (p.kind === "critical" || p.kind === "surplus" ? p.kind : "time") as Prediction["tagKind"],
        note: p.note,
        recommend: p.recommendation.units != null ? `${p.recommendation.action} ${p.recommendation.units} units` : p.recommendation.action,
      }))
    : mockPredictions;

  const insights: Insight[] = ins?.items
    ? ins.items.map((it) => ({
        title: it.title,
        body: it.body,
        icon: it.type === "pattern" ? "lineChart" : it.type === "optimization" ? "trendingUp" : "alert",
        accent: it.type === "pattern" ? "purple" : it.type === "optimization" ? "green" : "critical",
      }))
    : mockInsights;

  // If the live series has no signal yet (all zeros), show the representative
  // curve so the chart stays meaningful; switches to real data once populated.
  const hasSignal = series?.points?.some((p) => p.predicted > 0 || (p.actual ?? 0) > 0);
  return { stats: statCards, series: hasSignal ? series! : mockForecastSeries, predictions, insights };
}

export async function loadRedistribution() {
  const [stats, routes, transfers] = await Promise.all([
    safe(() => apiGet<{ pendingTransfers: number; inTransit: { count: number; batteriesEnRoute: number }; completedToday: { count: number; batteriesMoved: number }; fleet: { active: number; total: number } }>("/redistribution/stats"), null),
    safe(() => apiGet<{ nodes: (MapNode & { id: string })[]; routes: { id: string; fromId: string; toId: string; vehicleId: string }[]; vehicles: (Vehicle & { id: string })[] }>("/redistribution/routes"), null),
    safe(() => apiGet<{ items: { id: string; routeLabel: string; status: string; batteries: number; etaAt: string | null; departsAt: string | null; progressPct: number }[] }>("/transfers"), null),
  ]);

  const statCards: Stat[] = stats
    ? [
        { label: "Pending Transfers", value: String(stats.pendingTransfers), sub: "Awaiting dispatch", icon: "clock", accent: "warning" },
        { label: "In Transit", value: String(stats.inTransit.count), sub: `${stats.inTransit.batteriesEnRoute} batteries en route`, icon: "truck", accent: "info" },
        { label: "Completed Today", value: String(stats.completedToday.count), sub: `${stats.completedToday.batteriesMoved} batteries moved`, icon: "check", accent: "green" },
        { label: "Fleet Vehicles", value: String(stats.fleet.active), unit: `/${stats.fleet.total}`, sub: "Active now", icon: "van", accent: "green" },
      ]
    : redistributionStats;

  let map: { nodes: MapNode[]; routes: RouteLine[]; vehicles: Vehicle[] };
  if (routes && routes.nodes.length) {
    const all = [...routes.nodes, ...routes.vehicles];
    const scale = rescaler(all);
    map = {
      nodes: routes.nodes.map((n) => ({ id: n.id, label: n.label, kind: n.kind, ...scale(n) })),
      routes: routes.routes.map((r) => ({ from: r.fromId, to: r.toId })),
      vehicles: routes.vehicles.map((v) => ({ id: v.id, label: v.label, units: v.units, ...scale(v) })),
    };
  } else {
    map = { nodes: mapNodes, routes: routeLines, vehicles: mockVehicles };
  }

  const transferList: Transfer[] = transfers?.items
    ? transfers.items.map((t) => ({
        id: t.id,
        route: t.routeLabel,
        status: t.status === "in_transit" ? "In Transit" : t.status === "pending" ? "Pending" : t.status === "completed" ? "Completed" : "Cancelled",
        batteries: t.batteries,
        detail:
          t.status === "in_transit"
            ? `ETA ${etaLabel(t.etaAt)}`
            : t.status === "pending"
              ? t.departsAt
                ? `Departs ${clock(t.departsAt)}`
                : "Awaiting dispatch"
              : t.status === "completed"
                ? "Delivered"
                : "Cancelled",
        progress: t.progressPct,
      }))
    : mockTransfers;

  return { stats: statCards, map, transfers: transferList };
}

const DEFAULT_SETTINGS: Settings = {
  organization: { name: "3rike Lagos", region: "Lagos", currency: "NGN", timezone: "Africa/Lagos" },
  thresholds: { criticalBelowPct: 15, warningBelowPct: 30, autoGenerateAlerts: true, predictiveWarnings: true },
  ai: { forecastHorizon: "24h", autoRedistributeSurplus: true, weatherAdjusted: true },
  notifications: { criticalAlerts: true, dailyDigest: true, smsFieldTeam: false, weeklyReport: false },
};

export async function loadSettings(): Promise<Settings> {
  return safe(() => apiGet<Settings>("/settings"), DEFAULT_SETTINGS);
}
