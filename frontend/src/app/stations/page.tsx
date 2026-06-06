import type { Metadata } from "next";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { StationExplorer } from "@/components/stations/StationExplorer";
import { NetworkSummary } from "@/components/stations/NetworkSummary";

export const metadata: Metadata = { title: "Station Network" };

export default function StationsPage() {
  return (
    <>
      <PageHeader
        title="Station Network"
        actions={
          <>
            <div className="relative hidden sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
              <input
                type="text"
                placeholder="Search stations…"
                className="h-10 w-52 rounded-xl border border-border bg-surface-2/70 pl-9 pr-3 text-sm text-text placeholder:text-faint outline-none transition-all duration-200 focus:border-green/50 focus:ring-2 focus:ring-green/20"
              />
            </div>
            <Button>
              <Plus className="size-[18px]" />
              Add Station
            </Button>
          </>
        }
      />

      <StationExplorer summary={<NetworkSummary />} />
    </>
  );
}
