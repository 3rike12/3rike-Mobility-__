"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  ChartLine,
  Truck,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

type NavItem = { label: string; href: string; icon: LucideIcon };

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Station Network", href: "/stations", icon: Map },
  { label: "AI Forecasting", href: "/forecasting", icon: ChartLine },
  { label: "Redistribution", href: "/redistribution", icon: Truck },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="px-5 pt-6">
        <Logo />
      </div>

      <nav className="mt-8 flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-[rgba(1,194,89,0.12)] text-green"
                  : "text-muted hover:bg-surface-2 hover:text-text"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-green shadow-[0_0_10px_rgba(1,194,89,0.7)]" />
              )}
              <Icon
                className={cn(
                  "size-[18px] transition-transform duration-200 group-hover:scale-110",
                  active ? "text-green" : "text-faint group-hover:text-muted"
                )}
                strokeWidth={2}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* appearance */}
      <div className="mx-3 mb-2 flex items-center justify-between rounded-xl border border-border bg-surface-2/40 py-2 pl-3 pr-2">
        <span className="text-[12px] font-medium text-muted">Appearance</span>
        <ThemeToggle />
      </div>

      {/* operator card */}
      <div className="mx-3 mb-4 rounded-xl border border-border bg-surface-2/60 p-3">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-full bg-[conic-gradient(from_140deg,#01c259,#019f4a,#7bcd8a,#01c259)] text-[13px] font-bold text-[#06210f]">
            AO
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-text">
              Ada Okafor
            </div>
            <div className="truncate text-[11px] text-muted">Lagos HQ · Operator</div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 border-t border-border pt-2.5 text-[11px] text-muted">
          <span className="size-1.5 rounded-full bg-green" style={{ animation: "blink 1.6s ease-in-out infinite" }} />
          All systems nominal
          <span className="ml-auto font-mono text-faint">v3.2</span>
        </div>
      </div>
    </div>
  );
}
