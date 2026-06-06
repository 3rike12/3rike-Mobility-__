import {
  BatteryCharging,
  Zap,
  MapPinned,
  TriangleAlert,
  Timer,
  Gauge,
  Target,
  Wallet,
  Brain,
  Activity,
  ShieldCheck,
  RefreshCw,
  Clock,
  Truck,
  CheckCheck,
  ChartLine,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  battery: BatteryCharging,
  zap: Zap,
  mapPinned: MapPinned,
  alert: TriangleAlert,
  timer: Timer,
  gauge: Gauge,
  target: Target,
  wallet: Wallet,
  brain: Brain,
  activity: Activity,
  shield: ShieldCheck,
  refresh: RefreshCw,
  clock: Clock,
  truck: Truck,
  check: CheckCheck,
  van: Truck,
  lineChart: ChartLine,
  trendingUp: TrendingUp,
};

export function Icon({
  name,
  className,
  strokeWidth = 2,
}: {
  name: string;
  className?: string;
  strokeWidth?: number;
}) {
  const Cmp = MAP[name] ?? Activity;
  return <Cmp className={className} strokeWidth={strokeWidth} />;
}

export type AccentKey = "green" | "info" | "purple" | "warning" | "critical";

export const ACCENT: Record<AccentKey, { bg: string; color: string }> = {
  green: { bg: "rgba(1,194,89,0.12)", color: "#2bd178" },
  info: { bg: "rgba(90,169,255,0.13)", color: "#5aa9ff" },
  purple: { bg: "rgba(151,71,255,0.15)", color: "#a874ff" },
  warning: { bg: "rgba(241,176,88,0.13)", color: "#f1b058" },
  critical: { bg: "rgba(239,68,68,0.14)", color: "#f87171" },
};
