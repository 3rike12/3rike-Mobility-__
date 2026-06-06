"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CircleCheck, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "success" | "error";
type Toast = { id: number; title: string; description?: string; variant: Variant };
type ToastInput = { title: string; description?: string; variant?: Variant };

const ToastCtx = createContext<(t: ToastInput) => void>(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

let counter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const dismiss = useCallback((id: number) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (t: ToastInput) => {
      const id = ++counter;
      setToasts((ts) => [...ts, { id, title: t.title, description: t.description, variant: t.variant ?? "success" }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  return (
    <ToastCtx.Provider value={push}>
      {children}
      {mounted &&
        createPortal(
          <div className="pointer-events-none fixed bottom-4 right-4 z-[200] flex w-[min(92vw,360px)] flex-col gap-2.5">
            {toasts.map((t) => {
              const ok = t.variant === "success";
              const Icon = ok ? CircleCheck : TriangleAlert;
              return (
                <div
                  key={t.id}
                  className="pointer-events-auto relative flex animate-fade-up items-start gap-3 overflow-hidden rounded-xl border border-border bg-surface-2 p-3.5 shadow-2xl"
                >
                  <span
                    className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg"
                    style={{
                      background: ok ? "rgba(1,194,89,0.14)" : "rgba(239,68,68,0.14)",
                      color: ok ? "#2bd178" : "#f87171",
                    }}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-text">{t.title}</div>
                    {t.description && <div className="mt-0.5 text-[13px] text-muted">{t.description}</div>}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismiss(t.id)}
                    aria-label="Dismiss"
                    className="-mr-1 -mt-1 grid size-6 shrink-0 place-items-center rounded-md text-faint transition-colors hover:text-text"
                  >
                    <X className="size-4" />
                  </button>
                  <span
                    className={cn("absolute bottom-0 left-0 h-0.5 rounded-full", ok ? "bg-green" : "bg-critical")}
                    style={{ animation: "toast-bar 4s linear forwards" }}
                  />
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </ToastCtx.Provider>
  );
}
