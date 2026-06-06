"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Sparkles, X, ArrowRight, TrendingUp } from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://3.213.111.199:8000";

type Proposed = {
  fromStationId: string;
  toStationId: string;
  batteries: number;
  reason?: string;
  estImprovementPct?: number;
};

function titleCase(id: string) {
  return id.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function OptimizeRoutesButton() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"loading" | "done" | "applying">("loading");
  const [proposed, setProposed] = useState<Proposed[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function optimize() {
    setOpen(true);
    setPhase("loading");
    setError(null);
    setProposed([]);
    try {
      const res = await fetch(`${API_URL}/redistribution/optimize`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ horizon: "6h", autoApply: false }),
      });
      if (!res.ok) throw new Error(`Optimizer failed (${res.status})`);
      const data = await res.json();
      setProposed(Array.isArray(data?.proposed) ? data.proposed : []);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not optimize routes.");
      setPhase("done");
    }
  }

  async function apply() {
    setPhase("applying");
    setError(null);
    try {
      const res = await fetch(`${API_URL}/redistribution/optimize`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ horizon: "6h", autoApply: true }),
      });
      if (!res.ok) throw new Error(`Apply failed (${res.status})`);
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not apply transfers.");
      setPhase("done");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={optimize}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-green px-4 py-2 text-sm font-semibold text-[#06210f] shadow-[0_0_20px_rgba(1,194,89,0.3)] transition-all duration-200 hover:bg-green-hover hover:shadow-[0_0_28px_rgba(1,194,89,0.45)] active:scale-[0.97]"
      >
        <Sparkles className="size-[18px]" />
        Optimize Routes
      </button>

      {open &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div onClick={() => setOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
            <div className="relative w-full max-w-lg animate-pop rounded-2xl border border-border bg-surface p-6 shadow-2xl">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="absolute right-4 top-4 grid size-8 place-items-center rounded-lg text-muted transition-colors hover:text-text"
              >
                <X className="size-5" />
              </button>

              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl" style={{ background: "rgba(1,194,89,0.12)", color: "#2bd178" }}>
                  <Sparkles className="size-[18px]" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-text">AI Route Optimization</h2>
                  <p className="text-[13px] text-muted">Proposed transfers for the next 6 hours</p>
                </div>
              </div>

              <div className="mt-5">
                {phase === "loading" ? (
                  <div className="space-y-2.5">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-2" style={{ animationDelay: `${i * 120}ms` }} />
                    ))}
                    <p className="pt-1 text-center text-[13px] text-muted">Analyzing demand &amp; surplus…</p>
                  </div>
                ) : proposed.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-surface-2/40 py-10 text-center text-sm text-muted">
                    {error ? error : "Network is balanced — no transfers needed right now."}
                  </div>
                ) : (
                  <div className="max-h-[340px] space-y-2.5 overflow-y-auto pr-1">
                    {proposed.map((p, i) => (
                      <div key={i} className="rounded-xl border border-border bg-surface-2/50 p-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-text">
                            {titleCase(p.fromStationId)}
                            <ArrowRight className="size-3.5 text-green" />
                            {titleCase(p.toStationId)}
                          </div>
                          <span className="chip-online inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold tabular">
                            {p.batteries} batteries
                          </span>
                        </div>
                        {p.reason && <p className="mt-1.5 text-[13px] text-muted">{p.reason}</p>}
                        {typeof p.estImprovementPct === "number" && (
                          <p className="mt-1 inline-flex items-center gap-1 text-[13px] font-medium text-green">
                            <TrendingUp className="size-3.5" />+{p.estImprovementPct}% network efficiency
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && phase === "done" && proposed.length > 0 && (
                <p className="mt-3 text-[13px] text-critical">{error}</p>
              )}

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-border bg-surface-2 px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-3"
                >
                  Close
                </button>
                {phase !== "loading" && proposed.length > 0 && (
                  <button
                    type="button"
                    onClick={apply}
                    disabled={phase === "applying"}
                    className="inline-flex items-center gap-2 rounded-full bg-green px-4 py-2 text-sm font-semibold text-[#06210f] transition-all duration-200 hover:bg-green-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {phase === "applying" ? "Dispatching…" : `Dispatch all (${proposed.length})`}
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
