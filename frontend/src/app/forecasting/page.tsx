import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Panel } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ForecastChart } from "@/components/forecasting/ForecastChart";
import { AIPredictions } from "@/components/forecasting/AIPredictions";
import { InsightCard } from "@/components/forecasting/InsightCard";
import { AutoRefresh } from "@/components/shell/AutoRefresh";
import { loadForecasting } from "@/lib/api";

export const metadata: Metadata = { title: "AI Forecasting" };

function LegendItem({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-muted">
      <span
        className="h-[3px] w-4 rounded-full"
        style={{
          background: dashed
            ? `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 7px)`
            : color,
        }}
      />
      {label}
    </span>
  );
}

export default async function ForecastingPage() {
  const { stats, series, predictions, insights } = await loadForecasting();
  return (
    <>
      <AutoRefresh seconds={60} />
      <PageHeader
        title="AI Demand Forecasting"
        subtitle="Predictive analytics powered by machine learning"
        actions={
          <SegmentedControl
            options={[{ label: "Live", dot: true }, "Next 24 hours"]}
          />
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
          title="Demand Forecast — Network"
          actions={
            <div className="hidden items-center gap-3.5 sm:flex">
              <LegendItem color="#01c259" label="Predicted" />
              <LegendItem color="#7bcd8a" label="Actual" dashed />
              <LegendItem color="#ef4444" label="Shortage Risk" />
            </div>
          }
        >
          <div className="rounded-xl border border-border bg-bg/40 p-2 sm:p-3">
            <ForecastChart series={series} />
          </div>
        </Panel>

        <Panel
          className="animate-fade-up"
          style={{ animationDelay: "400ms" }}
          title="AI Predictions"
          badge={
            <span className="chip-online inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold">
              {predictions.length} · Next 6h
            </span>
          }
        >
          <AIPredictions predictions={predictions} />
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {insights.map((it, i) => (
          <InsightCard key={it.title} insight={it} index={i} />
        ))}
      </div>
    </>
  );
}
