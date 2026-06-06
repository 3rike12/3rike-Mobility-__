import type { Status } from "./utils";

/* ============================================================
   Mock data for the 3rike Swap operator dashboard.
   Numbers mirror the product mockups (Lagos-first network).
   ============================================================ */

export type Trend = { value: string; dir: "up" | "down" | "flat"; negative?: boolean };

export type Stat = {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  trend?: Trend;
  accent?: "green" | "warning" | "critical" | "purple" | "info";
  tone?: "default" | "critical" | "hero";
  icon: string; // lucide icon name key (mapped in component)
};

/* ---------- Dashboard ---------- */

export const dashboardStats: Stat[] = [
  {
    label: "Total Batteries",
    value: "2,847",
    sub: "+124 this week",
    trend: { value: "+124 this week", dir: "up" },
    icon: "battery",
    accent: "green",
  },
  {
    label: "Active Swaps Today",
    value: "1,293",
    trend: { value: "+18% vs yesterday", dir: "up" },
    icon: "zap",
    accent: "info",
  },
  {
    label: "Stations Online",
    value: "48",
    unit: "/52",
    sub: "4 stations need attention",
    icon: "mapPinned",
    accent: "purple",
  },
  {
    label: "Shortage Alerts",
    value: "7",
    sub: "3 critical, 4 warning",
    icon: "alert",
    accent: "critical",
    tone: "critical",
  },
];

export const dashboardSecondaryStats: Stat[] = [
  {
    label: "Avg Swap Time",
    value: "2.4",
    unit: "min",
    trend: { value: "-12% improved", dir: "down" },
    icon: "timer",
    accent: "green",
  },
  {
    label: "Fleet Utilization",
    value: "87",
    unit: "%",
    trend: { value: "+5% vs target", dir: "up" },
    icon: "gauge",
    accent: "green",
  },
  {
    label: "Prediction Accuracy",
    value: "94.2",
    unit: "%",
    sub: "AI model v3.2",
    icon: "target",
    accent: "green",
    tone: "hero",
  },
  {
    label: "Revenue Today",
    value: "₦1.2M",
    trend: { value: "+23% vs forecast", dir: "up" },
    icon: "wallet",
    accent: "green",
  },
];

export type HeatNode = {
  name: string;
  x: number; // %
  y: number; // %
  demand: number; // 0..100 -> bubble size
  status: Status;
};

export const heatNodes: HeatNode[] = [
  { name: "Maryland Mall", x: 19, y: 30, demand: 46, status: "online" },
  { name: "Allen Junction", x: 40, y: 52, demand: 70, status: "online" },
  { name: "Yaba Tech", x: 32, y: 64, demand: 34, status: "online" },
  { name: "Victoria Island", x: 53, y: 42, demand: 80, status: "critical" },
  { name: "Ikeja GRA", x: 60, y: 57, demand: 52, status: "warning" },
  { name: "Lekki Phase 1", x: 47, y: 70, demand: 40, status: "online" },
  { name: "Ikoyi", x: 67, y: 40, demand: 30, status: "online" },
  { name: "Surulere Stadium", x: 26, y: 73, demand: 78, status: "critical" },
];

export type Alert = {
  station: string;
  status: Status;
  message: string;
  time: string;
};

export const liveAlerts: Alert[] = [
  {
    station: "Victoria Island",
    status: "critical",
    message: "Only 2 batteries left, demand surge expected",
    time: "2 min ago",
  },
  {
    station: "Lekki Phase 1",
    status: "critical",
    message: "Station offline, 12 batteries stranded",
    time: "8 min ago",
  },
  {
    station: "Ikeja GRA",
    status: "warning",
    message: "Inventory below 30%, restock needed",
    time: "15 min ago",
  },
  {
    station: "Yaba Tech",
    status: "warning",
    message: "Peak hour demand predicted in 2h",
    time: "22 min ago",
  },
];

/* ---------- Station Network ---------- */

export type Station = {
  name: string;
  status: Status;
  inventory: number | null;
  capacity: number;
  swaps: number | null;
  estEmpty: string; // "18m" | "2.1h" | "--"
  lastOnline?: string;
};

export const stations: Station[] = [
  { name: "Victoria Island Hub", status: "critical", inventory: 2, capacity: 40, swaps: 127, estEmpty: "18m" },
  { name: "Surulere Stadium", status: "critical", inventory: 4, capacity: 35, swaps: 98, estEmpty: "25m" },
  { name: "Ikeja City Mall", status: "warning", inventory: 12, capacity: 40, swaps: 89, estEmpty: "2.1h" },
  { name: "Maryland Mall", status: "online", inventory: 36, capacity: 40, swaps: 43, estEmpty: "12h" },
  { name: "Lekki Phase 1", status: "online", inventory: 32, capacity: 40, swaps: 64, estEmpty: "8.4h" },
  { name: "Allen Junction", status: "online", inventory: 24, capacity: 30, swaps: 67, estEmpty: "5.8h" },
  { name: "Yaba Tech Campus", status: "online", inventory: 28, capacity: 35, swaps: 52, estEmpty: "6.2h" },
  { name: "Opebi Link Road", status: "offline", inventory: null, capacity: 30, swaps: null, estEmpty: "--", lastOnline: "2h ago" },
];

export type StationFilter = "All" | "Online" | "Offline" | "Low Stock" | "Critical";
export const stationFilters: StationFilter[] = ["All", "Online", "Offline", "Low Stock", "Critical"];

export const networkSummary = {
  totalStations: 52,
  online: 48,
  totalInventory: 1847,
  totalCapacity: 2080,
  critical: 3,
  warning: 4,
};

/* ---------- AI Forecasting ---------- */

export const forecastStats: Stat[] = [
  {
    label: "Model Accuracy",
    value: "94.2",
    unit: "%",
    sub: "3rike AI v3.2",
    icon: "brain",
    accent: "green",
    tone: "hero",
  },
  {
    label: "Predictions Today",
    value: "2,847",
    sub: "98.1% correct so far",
    icon: "activity",
    accent: "info",
  },
  {
    label: "Shortages Prevented",
    value: "23",
    sub: "This week",
    icon: "shield",
    accent: "green",
  },
  {
    label: "Next Update",
    value: "4:32",
    sub: "minutes",
    icon: "refresh",
    accent: "purple",
  },
];

// Hourly demand 6AM -> 12AM (index 0..18). Actual present up to "Now" (3PM, index 9).
export const forecastHours = [
  "6AM", "", "", "9AM", "", "", "12PM", "", "", "3PM", "", "", "6PM", "", "", "9PM", "", "", "12AM",
];
export const nowIndex = 9; // 3PM
export const riskRange: [number, number] = [12, 15]; // 6PM - 9PM
export const forecastMax = 800;

export const predictedSeries = [
  180, 320, 480, 520, 430, 360, 340, 380, 420, 460, 540, 660, 740, 700, 560, 420, 300, 220, 160,
];
export const actualSeries = [
  165, 300, 500, 540, 410, 350, 360, 372, 440, 455,
];

// Data-driven chart series (what the live API returns; the chart consumes this shape).
export type ChartPoint = { t: string; predicted: number; actual: number | null };
export type ChartSeries = {
  unitMax: number;
  nowAt: string;
  points: ChartPoint[];
  riskWindows: { startAt: string; endAt: string; severity?: string }[];
};

const _fbase = Date.parse("2026-06-06T06:00:00Z");
const _hr = 3_600_000;
export const mockForecastSeries: ChartSeries = {
  unitMax: forecastMax,
  nowAt: new Date(_fbase + nowIndex * _hr).toISOString(),
  points: predictedSeries.map((p, i) => ({
    t: new Date(_fbase + i * _hr).toISOString(),
    predicted: p,
    actual: i < actualSeries.length ? actualSeries[i] : null,
  })),
  riskWindows: [
    {
      startAt: new Date(_fbase + riskRange[0] * _hr).toISOString(),
      endAt: new Date(_fbase + riskRange[1] * _hr).toISOString(),
      severity: "critical",
    },
  ],
};

export type Prediction = {
  station: string;
  status: Status;
  tag: string; // time or label like "Critical" / "Surplus"
  tagKind: "critical" | "time" | "surplus";
  note: string;
  recommend: string;
};

export const predictions: Prediction[] = [
  {
    station: "Victoria Island",
    status: "critical",
    tag: "Critical",
    tagKind: "critical",
    note: "Empty in 18 min at current rate",
    recommend: "Emergency dispatch",
  },
  {
    station: "Lekki Phase 1",
    status: "warning",
    tag: "6:30 PM",
    tagKind: "time",
    note: "Rush hour surge expected",
    recommend: "Pre-position 15 units",
  },
  {
    station: "Yaba Tech",
    status: "warning",
    tag: "7:00 PM",
    tagKind: "time",
    note: "Class dismissal pattern detected",
    recommend: "Pre-position 10 units",
  },
  {
    station: "Allen Junction",
    status: "online",
    tag: "Surplus",
    tagKind: "surplus",
    note: "Low demand expected tonight",
    recommend: "Redistribute 8 units",
  },
];

export type Insight = {
  title: string;
  body: string;
  icon: string;
  accent: "purple" | "green" | "critical";
};

export const insights: Insight[] = [
  {
    title: "Pattern Detected",
    body: "Friday evening demand typically 34% higher than weekdays. Consider pre-positioning batteries by 4 PM.",
    icon: "lineChart",
    accent: "purple",
  },
  {
    title: "Optimization Opportunity",
    body: "3 stations have consistent surplus. Reallocating 25 batteries could improve network efficiency by 12%.",
    icon: "trendingUp",
    accent: "green",
  },
  {
    title: "Risk Alert",
    body: "Weather forecast: Rain expected 6-9 PM. Historical data shows 28% demand drop during rain.",
    icon: "alert",
    accent: "critical",
  },
];

/* ---------- Redistribution ---------- */

export const redistributionStats: Stat[] = [
  { label: "Pending Transfers", value: "12", sub: "Awaiting dispatch", icon: "clock", accent: "warning" },
  { label: "In Transit", value: "5", sub: "143 batteries en route", icon: "truck", accent: "info" },
  { label: "Completed Today", value: "8", sub: "247 batteries moved", icon: "check", accent: "green" },
  { label: "Fleet Vehicles", value: "6", unit: "/8", sub: "Active now", icon: "van", accent: "green" },
];

export type MapNode = {
  id: string;
  label: string;
  x: number; // %
  y: number; // %
  kind: "source" | "destination";
};

export type Vehicle = {
  id: string;
  label: string;
  x: number; // %
  y: number; // %
  units: number;
};

export type RouteLine = { from: string; to: string };

export const mapNodes: MapNode[] = [
  { id: "allen", label: "Allen", x: 18, y: 35, kind: "source" },
  { id: "maryland", label: "Maryland", x: 80, y: 26, kind: "source" },
  { id: "lekki", label: "Lekki", x: 86, y: 60, kind: "source" },
  { id: "yaba", label: "Yaba", x: 22, y: 74, kind: "destination" },
  { id: "surulere", label: "Surulere", x: 47, y: 82, kind: "destination" },
  { id: "vi", label: "Victoria Is.", x: 57, y: 66, kind: "destination" },
];

export const routeLines: RouteLine[] = [
  { from: "allen", to: "vi" },
  { from: "maryland", to: "surulere" },
  { from: "lekki", to: "yaba" },
];

export const vehicles: Vehicle[] = [
  { id: "VH-01", label: "VH-01", x: 39, y: 52, units: 25 },
  { id: "VH-03", label: "VH-03", x: 65, y: 50, units: 18 },
  { id: "VH-05", label: "VH-05", x: 52, y: 67, units: 12 },
];

export type Transfer = {
  id: string;
  route: string;
  status: "In Transit" | "Pending" | "Completed" | "Cancelled";
  batteries: number;
  detail: string; // ETA or departs
  progress: number; // 0..100
};

export const transfers: Transfer[] = [
  { id: "VH-01", route: "Allen → Victoria Is.", status: "In Transit", batteries: 25, detail: "ETA 12 min", progress: 72 },
  { id: "VH-03", route: "Maryland → Surulere", status: "In Transit", batteries: 18, detail: "ETA 8 min", progress: 84 },
  { id: "VH-05", route: "Lekki → Yaba Tech", status: "In Transit", batteries: 12, detail: "ETA 22 min", progress: 46 },
  { id: "VH-02", route: "Ikeja → Lekki Ph1", status: "Pending", batteries: 30, detail: "Departs 4:30 PM", progress: 0 },
  { id: "VH-04", route: "Festac → Ikeja GRA", status: "Pending", batteries: 22, detail: "Departs 5:00 PM", progress: 0 },
];
