"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Truck, X, ChevronDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://3.213.111.199:8000";

type StationOpt = { id: string; name: string; status: string };

const inputCls =
  "h-10 w-full rounded-xl border border-border bg-surface-2/70 px-3 text-sm text-text outline-none transition-all duration-200 focus:border-green/50 focus:ring-2 focus:ring-green/20";

export function ScheduleRedistributionButton() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [stations, setStations] = useState<StationOpt[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [batteries, setBatteries] = useState("15");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function openModal() {
    setOpen(true);
    setError(null);
    if (stations.length) return;
    try {
      const res = await fetch(`${API_URL}/stations`, { headers: { accept: "application/json" } });
      const data = await res.json();
      const items: StationOpt[] = (data?.items ?? []).map((s: StationOpt) => ({ id: s.id, name: s.name, status: s.status }));
      setStations(items);
      // sensible defaults: source = a healthy station, destination = a low/critical one
      const source = items.find((s) => s.status === "online") ?? items[0];
      const dest = items.find((s) => s.status === "critical" || s.status === "warning") ?? items[1];
      if (source) setFrom(source.id);
      if (dest && dest.id !== source?.id) setTo(dest.id);
      else if (items[1]) setTo(items[1].id);
    } catch {
      setError("Could not load stations.");
    }
  }

  const valid = from && to && from !== to && Number(batteries) > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/transfers`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fromStationId: from, toStationId: to, batteries: Number(batteries) }),
      });
      if (!res.ok) throw new Error(res.status === 422 ? "Not enough batteries at the source station." : `Request failed (${res.status})`);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not schedule transfer.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-green px-4 py-2.5 text-sm font-semibold text-[#06210f] shadow-[0_0_20px_rgba(1,194,89,0.3)] transition-all duration-200 hover:bg-green-hover hover:shadow-[0_0_28px_rgba(1,194,89,0.45)] active:scale-[0.98]"
      >
        <Truck className="size-[18px]" />
        Schedule Redistribution
      </button>

      {open &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div onClick={() => setOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
            <form onSubmit={submit} className="relative w-full max-w-md animate-pop rounded-2xl border border-border bg-surface p-6 shadow-2xl">
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="absolute right-4 top-4 grid size-8 place-items-center rounded-lg text-muted transition-colors hover:text-text">
                <X className="size-5" />
              </button>

              <h2 className="text-lg font-semibold tracking-tight text-text">Schedule Redistribution</h2>
              <p className="mt-1 text-[13px] text-muted">Move batteries from a surplus station to one running low.</p>

              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                  <Select label="From" value={from} onChange={setFrom} options={stations} />
                  <ArrowRight className="mb-2.5 size-4 text-green" />
                  <Select label="To" value={to} onChange={setTo} options={stations} />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-text">Batteries</label>
                  <input className={inputCls} type="number" min={1} value={batteries} onChange={(e) => setBatteries(e.target.value)} />
                </div>
              </div>

              {error && (
                <p className="mt-4 rounded-lg border border-critical/30 bg-[rgba(239,68,68,0.08)] px-3 py-2 text-[13px] text-critical">{error}</p>
              )}

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-border bg-surface-2 px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-3">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!valid || busy}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full bg-green px-4 py-2 text-sm font-semibold text-[#06210f] transition-all duration-200",
                    !valid || busy ? "cursor-not-allowed opacity-50" : "hover:bg-green-hover active:scale-[0.97]"
                  )}
                >
                  {busy ? "Scheduling…" : "Dispatch"}
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}
    </>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: StationOpt[];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-text">{label}</label>
      <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} appearance-none pr-9`}>
          {options.length === 0 && <option>Loading…</option>}
          {options.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
      </div>
    </div>
  );
}
