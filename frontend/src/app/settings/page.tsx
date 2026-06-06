import type { Metadata } from "next";
import { ChevronDown, Check } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Panel } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { InventoryBar } from "@/components/ui/InventoryBar";

export const metadata: Metadata = { title: "Settings" };

const inputCls =
  "h-10 w-full rounded-xl border border-border bg-surface-2/70 px-3 text-sm text-text placeholder:text-faint outline-none transition-all duration-200 focus:border-green/50 focus:ring-2 focus:ring-green/20";

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-[13px] font-medium text-text">{children}</label>;
}

function Select({ children, defaultValue }: { children: React.ReactNode; defaultValue?: string }) {
  return (
    <div className="relative">
      <select defaultValue={defaultValue} className={`${inputCls} appearance-none pr-9`}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
    </div>
  );
}

function ToggleRow({
  title,
  desc,
  defaultOn,
}: {
  title: string;
  desc: string;
  defaultOn?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3.5 last:border-0">
      <div>
        <div className="text-sm font-medium text-text">{title}</div>
        <div className="text-[13px] text-muted">{desc}</div>
      </div>
      <Toggle defaultOn={defaultOn} />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Manage your network preferences, thresholds, and alerts"
        actions={
          <Button>
            <Check className="size-[18px]" />
            Save changes
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel className="animate-fade-up" title="Organization">
          <div className="space-y-4">
            <div>
              <Label>Operator name</Label>
              <input className={inputCls} defaultValue="3rike Lagos" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Primary region</Label>
                <Select defaultValue="Lagos">
                  <option>Lagos</option>
                  <option>Abuja</option>
                  <option>Port Harcourt</option>
                </Select>
              </div>
              <div>
                <Label>Currency</Label>
                <Select defaultValue="NGN (₦)">
                  <option>NGN (₦)</option>
                  <option>USD ($)</option>
                  <option>GHS (₵)</option>
                </Select>
              </div>
            </div>
            <div>
              <Label>Timezone</Label>
              <Select defaultValue="West Africa Time (GMT+1)">
                <option>West Africa Time (GMT+1)</option>
                <option>Central Africa Time (GMT+2)</option>
              </Select>
            </div>
          </div>
        </Panel>

        <Panel className="animate-fade-up" style={{ animationDelay: "80ms" }} title="Alert Thresholds">
          <div className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Critical — battery level below</Label>
                <span className="tabular text-sm font-semibold text-critical">15%</span>
              </div>
              <InventoryBar pct={15} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Warning — battery level below</Label>
                <span className="tabular text-sm font-semibold text-warning">30%</span>
              </div>
              <InventoryBar pct={30} />
            </div>
            <div className="pt-1">
              <ToggleRow
                title="Auto-generate alerts"
                desc="Raise alerts automatically when thresholds are crossed"
                defaultOn
              />
              <ToggleRow
                title="Predictive shortage warnings"
                desc="Warn before a station is forecast to run empty"
                defaultOn
              />
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
              <span className="chip-online inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold">
                3rike AI v3.2
              </span>
            </div>
            <div>
              <Label>Forecast horizon</Label>
              <Select defaultValue="Next 24 hours">
                <option>Next 6 hours</option>
                <option>Next 12 hours</option>
                <option>Next 24 hours</option>
                <option>Next 7 days</option>
              </Select>
            </div>
            <div className="pt-1">
              <ToggleRow
                title="Auto-redistribute surplus"
                desc="Let the AI schedule transfers from surplus stations"
                defaultOn
              />
              <ToggleRow
                title="Weather-adjusted demand"
                desc="Factor rainfall forecasts into demand predictions"
                defaultOn
              />
            </div>
          </div>
        </Panel>

        <Panel className="animate-fade-up" style={{ animationDelay: "240ms" }} title="Notifications">
          <div>
            <ToggleRow title="Critical shortage alerts" desc="Push immediately for critical stations" defaultOn />
            <ToggleRow title="Daily summary digest" desc="A network recap every morning at 7 AM" defaultOn />
            <ToggleRow title="SMS to field team" desc="Text dispatch instructions to drivers" />
            <ToggleRow title="Weekly performance report" desc="Email a network performance summary" />
          </div>
        </Panel>
      </div>
    </>
  );
}
