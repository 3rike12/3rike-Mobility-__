"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { stationFilters, type StationFilter, type Station } from "@/lib/data";
import { StationCard } from "./StationCard";
import { useStationSearch } from "./StationSearch";

function matches(filter: StationFilter, status: string): boolean {
  switch (filter) {
    case "Online":
      return status === "online";
    case "Offline":
      return status === "offline";
    case "Low Stock":
      return status === "warning";
    case "Critical":
      return status === "critical";
    default:
      return true;
  }
}

export function StationExplorer({
  stations,
  summary,
}: {
  stations: Station[];
  summary: React.ReactNode;
}) {
  const [filter, setFilter] = useState<StationFilter>("All");
  const { query } = useStationSearch();
  const q = query.trim().toLowerCase();
  const filtered = stations.filter(
    (s) => matches(filter, s.status) && (q === "" || s.name.toLowerCase().includes(q))
  );

  return (
    <div className="space-y-4">
      {/* filter pills */}
      <div className="flex flex-wrap gap-2">
        {stationFilters.map((f) => {
          const active = f === filter;
          const count =
            f === "All" ? stations.length : stations.filter((s) => matches(f, s.status)).length;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-200",
                active
                  ? "bg-green text-[#06210f] shadow-[0_0_16px_rgba(1,194,89,0.35)]"
                  : "border border-border bg-surface-2/60 text-muted hover:text-text"
              )}
            >
              {f}
              <span
                className={cn(
                  "tabular text-[11px]",
                  active ? "text-[#06210f]/70" : "text-faint"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div
          key={filter}
          className="grid content-start grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2"
        >
          {filtered.map((s, i) => (
            <StationCard key={s.name} station={s} index={i} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-border bg-surface/50 py-16 text-center text-sm text-muted">
              No stations match{q ? ` “${query.trim()}”` : " this filter"}.
            </div>
          )}
        </div>

        <div className="lg:col-span-1">{summary}</div>
      </div>
    </div>
  );
}
