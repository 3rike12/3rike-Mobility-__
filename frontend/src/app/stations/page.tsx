import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { StationExplorer } from "@/components/stations/StationExplorer";
import { NetworkSummary } from "@/components/stations/NetworkSummary";
import { AddStationButton } from "@/components/stations/AddStationButton";
import { loadStations } from "@/lib/api";

export const metadata: Metadata = { title: "Station Network" };

export default async function StationsPage() {
  const { stations, summary } = await loadStations();
  return (
    <>
      <PageHeader title="Station Network" actions={<AddStationButton />} />

      <StationExplorer stations={stations} summary={<NetworkSummary summary={summary} />} />
    </>
  );
}
