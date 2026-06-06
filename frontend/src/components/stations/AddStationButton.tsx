"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://3.213.111.199:8000";

const inputCls =
  "h-10 w-full rounded-xl border border-border bg-surface-2/70 px-3 text-sm text-text placeholder:text-faint outline-none transition-all duration-200 focus:border-green/50 focus:ring-2 focus:ring-green/20";

export function AddStationButton() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("50");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  const valid = name.trim().length > 0 && Number(capacity) > 0;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function reset() {
    setName("");
    setCapacity("50");
    setAddress("");
    setLat("");
    setLng("");
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/stations`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          capacity: Number(capacity),
          address: address.trim() || undefined,
          lat: lat ? Number(lat) : undefined,
          lng: lng ? Number(lng) : undefined,
        }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setOpen(false);
      reset();
      router.refresh(); // re-fetch the server-rendered station list
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add station.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-green px-4 py-2 text-sm font-semibold text-[#06210f] shadow-[0_0_20px_rgba(1,194,89,0.3)] transition-all duration-200 hover:bg-green-hover hover:shadow-[0_0_28px_rgba(1,194,89,0.45)] active:scale-[0.97]"
      >
        <Plus className="size-[18px]" />
        Add Station
      </button>

      {open &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            />
          <form
            onSubmit={submit}
            className="relative w-full max-w-md animate-pop rounded-2xl border border-border bg-surface p-6 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 grid size-8 place-items-center rounded-lg text-muted transition-colors hover:text-text"
            >
              <X className="size-5" />
            </button>

            <h2 className="text-lg font-semibold tracking-tight text-text">Add Station</h2>
            <p className="mt-1 text-[13px] text-muted">Register a new swap station on the network.</p>

            <div className="mt-5 space-y-4">
              <Field label="Station name" required>
                <input
                  autoFocus
                  className={inputCls}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Yaba Tech Campus"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Capacity" required>
                  <input
                    className={inputCls}
                    type="number"
                    min={1}
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                  />
                </Field>
                <Field label="Address">
                  <input
                    className={inputCls}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Lagos"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Latitude">
                  <input className={inputCls} value={lat} onChange={(e) => setLat(e.target.value)} placeholder="6.5174" />
                </Field>
                <Field label="Longitude">
                  <input className={inputCls} value={lng} onChange={(e) => setLng(e.target.value)} placeholder="3.3776" />
                </Field>
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-lg border border-critical/30 bg-[rgba(239,68,68,0.08)] px-3 py-2 text-[13px] text-critical">
                {error}
              </p>
            )}

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-border bg-surface-2 px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-3"
              >
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
                {busy ? "Adding…" : "Add Station"}
              </button>
            </div>
          </form>
          </div>,
          document.body
        )}
    </>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-text">
        {label}
        {required && <span className="text-green"> *</span>}
      </label>
      {children}
    </div>
  );
}
