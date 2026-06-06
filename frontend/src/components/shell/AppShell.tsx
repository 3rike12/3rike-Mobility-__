"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { Logo } from "./Logo";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // close the mobile drawer whenever the route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[268px] border-r border-border lg:block">
        <Sidebar />
      </aside>

      {/* mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-bg/80 px-4 py-3 backdrop-blur-md lg:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="grid size-9 place-items-center rounded-lg border border-border text-muted transition-colors hover:text-text"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {/* mobile drawer + scrim */}
      <div
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] border-r border-border shadow-2xl transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="absolute right-3 top-5 z-10 grid size-8 place-items-center rounded-lg text-muted transition-colors hover:text-text"
        >
          <X className="size-5" />
        </button>
        <Sidebar />
      </aside>

      {/* main content */}
      <main className="lg:pl-[268px]">
        <div className="mx-auto max-w-[1540px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
