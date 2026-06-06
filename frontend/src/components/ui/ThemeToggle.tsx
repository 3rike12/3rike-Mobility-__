"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  // sync with whatever the no-flash script already set on <html>
  useEffect(() => {
    const t = document.documentElement.dataset.theme;
    setTheme(t === "light" ? "light" : "dark");
  }, []);

  function apply(next: Theme) {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* ignore */
    }
    setTheme(next);
  }

  const opts: { key: Theme; icon: typeof Sun; label: string }[] = [
    { key: "light", icon: Sun, label: "Light" },
    { key: "dark", icon: Moon, label: "Dark" },
  ];

  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-border bg-surface-2/70 p-0.5">
      {opts.map(({ key, icon: I, label }) => {
        const active = theme === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => apply(key)}
            aria-label={`${label} theme`}
            aria-pressed={active}
            className={cn(
              "grid size-7 place-items-center rounded-full transition-all duration-200",
              active
                ? "bg-green text-[#06210f] shadow-[0_0_12px_rgba(1,194,89,0.4)]"
                : "text-muted hover:text-text"
            )}
          >
            <I className="size-4" strokeWidth={2.2} />
          </button>
        );
      })}
    </div>
  );
}
