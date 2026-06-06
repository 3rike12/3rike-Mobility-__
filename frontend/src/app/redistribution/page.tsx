import type { Metadata } from "next";
import { Clock } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { Panel } from "@/components/ui/Card";
import { OptimizeRoutesButton } from "@/components/redistribution/OptimizeRoutesButton";
import { RouteMap } from "@/components/redistribution/RouteMap";
import { ActiveTransfers } from "@/components/redistribution/ActiveTransfers";
import { AutoRefresh } from "@/components/shell/AutoRefresh";
import { loadRedistribution } from "@/lib/api";

export const metadata: Metadata = { title: "Redistribution" };

export default async function RedistributionPage() {
  const { stats, map, transfers } = await loadRedistribution();
  return (
    <>
      <AutoRefresh seconds={12} />
      <PageHeader
        title="Redistribution Planner"
        subtitle="Optimize battery logistics across your station network"
        actions={
          <>
            <Button variant="secondary">
              <Clock className="size-[18px] text-muted" />
              Today
            </Button>
            <OptimizeRoutesButton />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} stat={stat} index={i} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2 animate-fade-up"
          style={{ animationDelay: "320ms" }}
          title="Active Routes"
        >
          <RouteMap nodes={map.nodes} routes={map.routes} vehicles={map.vehicles} />
        </Panel>

        <Panel
          className="animate-fade-up"
          style={{ animationDelay: "400ms" }}
          title="Active Transfers"
          badge={
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-[rgba(90,169,255,0.13)] px-1.5 text-[11px] font-bold text-info">
              {transfers.length}
            </span>
          }
        >
          <ActiveTransfers transfers={transfers} />
        </Panel>
      </div>
    </>
  );
}
