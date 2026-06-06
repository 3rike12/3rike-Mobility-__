import { Search, Bell } from "lucide-react";

export function TopActions({ searchPlaceholder = "Search…" }: { searchPlaceholder?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative hidden sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          className="h-10 w-44 rounded-xl border border-border bg-surface-2/70 pl-9 pr-3 text-sm text-text placeholder:text-faint outline-none transition-all duration-200 focus:w-60 focus:border-green/50 focus:ring-2 focus:ring-green/20 md:w-56"
        />
      </div>
      <button
        type="button"
        aria-label="Notifications"
        className="relative grid size-10 place-items-center rounded-xl border border-border bg-surface-2/70 text-muted transition-colors hover:text-text"
      >
        <Bell className="size-[18px]" />
        <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-critical ring-2 ring-surface" />
      </button>
      <button
        type="button"
        aria-label="Account"
        className="size-10 rounded-full bg-[conic-gradient(from_140deg,#01c259,#019f4a,#7bcd8a,#01c259)] ring-1 ring-inset ring-white/20 transition-transform hover:scale-105"
      />
    </div>
  );
}
