"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Option = string | { label: string; dot?: boolean };

function norm(o: Option): { label: string; dot?: boolean } {
  return typeof o === "string" ? { label: o } : o;
}

/** Self-stateful pill toggle (decorative). Active pill = solid 3rike green. */
export function SegmentedControl({
  options,
  defaultValue,
  size = "md",
  className,
}: {
  options: Option[];
  defaultValue?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const items = options.map(norm);
  const [value, setValue] = useState(defaultValue ?? items[0]?.label);

  const pad = size === "sm" ? "px-3 py-1 text-[12px]" : "px-3.5 py-1.5 text-[13px]";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-surface-2/70 p-1",
        className
      )}
    >
      {items.map((it) => {
        const active = it.label === value;
        return (
          <button
            key={it.label}
            type="button"
            onClick={() => setValue(it.label)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full font-medium transition-all duration-200",
              pad,
              active
                ? "bg-green text-[#06210f] shadow-[0_0_16px_rgba(1,194,89,0.35)]"
                : "text-muted hover:text-text"
            )}
          >
            {it.dot && (
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  active ? "bg-[#06210f]" : "bg-green"
                )}
                style={active ? undefined : { animation: "blink 1.4s ease-in-out infinite" }}
              />
            )}
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
