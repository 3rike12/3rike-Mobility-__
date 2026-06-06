"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => setOn((v) => !v)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200",
        on ? "bg-green shadow-[0_0_14px_rgba(1,194,89,0.45)]" : "bg-surface-3"
      )}
    >
      <span
        className={cn(
          "inline-block size-4 rounded-full bg-white shadow transition-transform duration-200",
          on ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}
