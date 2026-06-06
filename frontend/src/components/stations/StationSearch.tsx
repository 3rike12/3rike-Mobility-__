"use client";

import { createContext, useContext, useState } from "react";
import { Search } from "lucide-react";

const Ctx = createContext<{ query: string; setQuery: (v: string) => void }>({
  query: "",
  setQuery: () => {},
});

export function useStationSearch() {
  return useContext(Ctx);
}

/** Shares the search query between the header input and the station grid. */
export function StationSearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState("");
  return <Ctx.Provider value={{ query, setQuery }}>{children}</Ctx.Provider>;
}

/** The search box that lives in the page header, next to "Add Station". */
export function StationSearchInput() {
  const { query, setQuery } = useStationSearch();
  return (
    <div className="relative hidden sm:block">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search stations…"
        className="h-10 w-52 rounded-xl border border-border bg-surface-2/70 pl-9 pr-3 text-sm text-text placeholder:text-faint outline-none transition-all duration-200 focus:w-60 focus:border-green/50 focus:ring-2 focus:ring-green/20"
      />
    </div>
  );
}
