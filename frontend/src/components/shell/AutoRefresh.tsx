"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-fetches the route's server data on an interval so "Live" screens stay fresh.
 *  router.refresh() reconciles in place — no skeleton flash, no re-run animations. */
export function AutoRefresh({ seconds = 12 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        router.refresh();
      }
    }, Math.max(5, seconds) * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
