import { cn } from "@/lib/utils";

/** Shimmering placeholder block. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-md bg-surface-2", className)}>
      <span
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
        style={{ animation: "shimmer 1.4s infinite" }}
      />
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="size-9 rounded-xl" />
      </div>
      <Skeleton className="mt-4 h-8 w-28" />
      <Skeleton className="mt-3 h-3 w-32" />
    </div>
  );
}

function PanelSkeleton({ className, rows = 4 }: { className?: string; rows?: number }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-surface p-5 sm:p-6", className)}>
      <Skeleton className="h-5 w-40" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** Generic page-load skeleton that mirrors the dashboard-style layouts. */
export function PageSkeleton() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-64" />
          <Skeleton className="mt-2 h-3 w-80" />
        </div>
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 lg:col-span-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-5 h-[300px] w-full rounded-xl" />
        </div>
        <PanelSkeleton />
      </div>
    </div>
  );
}
