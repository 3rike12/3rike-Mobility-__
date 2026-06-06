"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Panel } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import type { Settings } from "@/lib/api";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://3.213.111.199:8000";

const inputCls =
  "h-10 w-full rounded-xl border border-border bg-surface-2/70 px-3 text-sm text-text placeholder:text-faint outline-none transition-all duration-200 focus:border-green/50 focus:ring-2 focus:ring-green/20";

export function SettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<Settings>(initial);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function patch(updater: (f: Settings) => Settings) {
    setForm((f) => updater(structuredClone(f)));
    setDirty(true);
    setSaved(false);
  }

  async function save() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/settings`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      toast({ title: "Settings saved", description: "Your changes are live across the network." });
      setSaved(true);
      setDirty(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save settings.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-end gap-3 animate-fade-up">
        <span className="text-[13px] text-muted">
          {error ? <span className="text-critical">{error}</span> : saved && !dirty ? "All changes saved" : dirty ? "Unsaved changes" : ""}
        </span>
        <button
          type="button"
          onClick={save}
          disabled={busy || !dirty}
          className={cn(
            "inline-flex items-center gap-2 rounded-full bg-green px-4 py-2 text-sm font-semibold text-[#06210f] shadow-[0_0_20px_rgba(1,194,89,0.3)] transition-all duration-200",
            busy || !dirty ? "cursor-not-allowed opacity-50" : "hover:bg-green-hover active:scale-[0.97]"
          )}
        >
          <Check className="size-[18px]" />
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel className="animate-fade-up" title="Organization">
          <div className="space-y-4">
            <Field label="Operator name">
              <input
                className={inputCls}
                value={form.organization.name}
                onChange={(e) => patch((f) => ((f.organization.name = e.target.value), f))}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Primary region">
                <Select value={form.organization.region} onChange={(v) => patch((f) => ((f.organization.region = v), f))}
                  options={[["Lagos", "Lagos"], ["Abuja", "Abuja"], ["Port Harcourt", "Port Harcourt"]]} />
              </Field>
              <Field label="Currency">
                <Select value={form.organization.currency} onChange={(v) => patch((f) => ((f.organization.currency = v), f))}
                  options={[["NGN", "NGN (₦)"], ["USD", "USD ($)"], ["GHS", "GHS (₵)"]]} />
              </Field>
            </div>
            <Field label="Timezone">
              <Select value={form.organization.timezone} onChange={(v) => patch((f) => ((f.organization.timezone = v), f))}
                options={[["Africa/Lagos", "West Africa Time (GMT+1)"], ["Africa/Maputo", "Central Africa Time (GMT+2)"]]} />
            </Field>
          </div>
        </Panel>

        <Panel className="animate-fade-up" style={{ animationDelay: "80ms" }} title="Alert Thresholds">
          <div className="space-y-5">
            <Range label="Critical — battery level below" color="#ef4444" value={form.thresholds.criticalBelowPct}
              onChange={(v) => patch((f) => ((f.thresholds.criticalBelowPct = v), f))} />
            <Range label="Warning — battery level below" color="#f1b058" value={form.thresholds.warningBelowPct}
              onChange={(v) => patch((f) => ((f.thresholds.warningBelowPct = v), f))} />
            <div className="pt-1">
              <ToggleRow title="Auto-generate alerts" desc="Raise alerts automatically when thresholds are crossed"
                on={form.thresholds.autoGenerateAlerts} onToggle={() => patch((f) => ((f.thresholds.autoGenerateAlerts = !f.thresholds.autoGenerateAlerts), f))} />
              <ToggleRow title="Predictive shortage warnings" desc="Warn before a station is forecast to run empty"
                on={form.thresholds.predictiveWarnings} onToggle={() => patch((f) => ((f.thresholds.predictiveWarnings = !f.thresholds.predictiveWarnings), f))} />
            </div>
          </div>
        </Panel>

        <Panel className="animate-fade-up" style={{ animationDelay: "160ms" }} title="AI Forecasting">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-green/25 bg-[rgba(1,194,89,0.06)] px-4 py-3">
              <div>
                <div className="text-sm font-medium text-text">Active model</div>
                <div className="text-[13px] text-muted">Updated 6 hours ago</div>
              </div>
              <span className="chip-online inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold">3rike AI v3.2</span>
            </div>
            <Field label="Forecast horizon">
              <Select value={form.ai.forecastHorizon} onChange={(v) => patch((f) => ((f.ai.forecastHorizon = v), f))}
                options={[["6h", "Next 6 hours"], ["12h", "Next 12 hours"], ["24h", "Next 24 hours"], ["7d", "Next 7 days"]]} />
            </Field>
            <div className="pt-1">
              <ToggleRow title="Auto-redistribute surplus" desc="Let the AI schedule transfers from surplus stations"
                on={form.ai.autoRedistributeSurplus} onToggle={() => patch((f) => ((f.ai.autoRedistributeSurplus = !f.ai.autoRedistributeSurplus), f))} />
              <ToggleRow title="Weather-adjusted demand" desc="Factor rainfall forecasts into demand predictions"
                on={form.ai.weatherAdjusted} onToggle={() => patch((f) => ((f.ai.weatherAdjusted = !f.ai.weatherAdjusted), f))} />
            </div>
          </div>
        </Panel>

        <Panel className="animate-fade-up" style={{ animationDelay: "240ms" }} title="Notifications">
          <div>
            <ToggleRow title="Critical shortage alerts" desc="Push immediately for critical stations"
              on={form.notifications.criticalAlerts} onToggle={() => patch((f) => ((f.notifications.criticalAlerts = !f.notifications.criticalAlerts), f))} />
            <ToggleRow title="Daily summary digest" desc="A network recap every morning at 7 AM"
              on={form.notifications.dailyDigest} onToggle={() => patch((f) => ((f.notifications.dailyDigest = !f.notifications.dailyDigest), f))} />
            <ToggleRow title="SMS to field team" desc="Text dispatch instructions to drivers"
              on={form.notifications.smsFieldTeam} onToggle={() => patch((f) => ((f.notifications.smsFieldTeam = !f.notifications.smsFieldTeam), f))} />
            <ToggleRow title="Weekly performance report" desc="Email a network performance summary"
              on={form.notifications.weeklyReport} onToggle={() => patch((f) => ((f.notifications.weeklyReport = !f.notifications.weeklyReport), f))} />
          </div>
        </Panel>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-text">{label}</label>
      {children}
    </div>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} appearance-none pr-9`}>
        {options.map(([val, label]) => (
          <option key={val} value={val}>
            {label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
    </div>
  );
}

function Range({ label, value, color, onChange }: { label: string; value: number; color: string; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-[13px] font-medium text-text">{label}</label>
        <span className="tabular text-sm font-semibold" style={{ color }}>{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-track"
        style={{ accentColor: color }}
      />
    </div>
  );
}

function ToggleRow({ title, desc, on, onToggle }: { title: string; desc: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3.5 last:border-0">
      <div>
        <div className="text-sm font-medium text-text">{title}</div>
        <div className="text-[13px] text-muted">{desc}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={onToggle}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200",
          on ? "bg-green shadow-[0_0_14px_rgba(1,194,89,0.45)]" : "bg-surface-3"
        )}
      >
        <span className={cn("inline-block size-4 rounded-full bg-white shadow transition-transform duration-200", on ? "translate-x-6" : "translate-x-1")} />
      </button>
    </div>
  );
}
