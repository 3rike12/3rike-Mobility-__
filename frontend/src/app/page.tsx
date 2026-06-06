import { PageHeader } from "@/components/shell/PageHeader";
import { TopActions } from "@/components/shell/TopActions";
import { StatCard } from "@/components/ui/StatCard";
import { Panel } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { DemandHeatmap } from "@/components/dashboard/DemandHeatmap";
import { LiveAlerts } from "@/components/dashboard/LiveAlerts";
import { AutoRefresh } from "@/components/shell/AutoRefresh";
import { loadDashboard } from "@/lib/api";

export default async function DashboardPage() {
  const { topStats, secondaryStats, heatNodes, alerts } = await loadDashboard();
  return (
    <>
      <AutoRefresh seconds={12} />
      <PageHeader
        title="Operations Dashboard"
        subtitle="Real-time demand forecasting and inventory management"
        actions={<TopActions />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {topStats.map((stat, i) => (
          <StatCard key={stat.label} stat={stat} index={i} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2 animate-fade-up"
          style={{ animationDelay: "320ms" }}
          title="Demand Heatmap"
          actions={
            <SegmentedControl
              size="sm"
              options={[{ label: "Live", dot: true }, "24h", "7 days"]}
            />
          }
        >
          <DemandHeatmap nodes={heatNodes} />
        </Panel>

        <Panel
          className="animate-fade-up"
          style={{ animationDelay: "400ms" }}
          title="Live Alerts"
          badge={
            <span className="chip-critical inline-flex h-5 min-w-5 items-center justify-center rounded-md px-1.5 text-[11px] font-bold">
              {alerts.length}
            </span>
          }
        >
          <LiveAlerts alerts={alerts} />
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {secondaryStats.map((stat, i) => (
          <StatCard key={stat.label} stat={stat} index={i + 4} />
        ))}
      </div>
    </>
  );
}
