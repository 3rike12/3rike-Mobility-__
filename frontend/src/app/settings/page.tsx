import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { loadSettings } from "@/lib/api";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const settings = await loadSettings();
  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your network preferences, thresholds, and alerts" />
      <SettingsForm initial={settings} />
    </>
  );
}
