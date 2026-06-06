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
  green: { bg: "var(--accent-green-bg)", color: "var(--accent-green)" },
  info: { bg: "var(--accent-info-bg)", color: "var(--accent-info)" },
  purple: { bg: "var(--accent-purple-bg)", color: "var(--accent-purple)" },
  warning: { bg: "var(--accent-warning-bg)", color: "var(--accent-warning)" },
  critical: { bg: "var(--accent-critical-bg)", color: "var(--accent-critical)" },
};
