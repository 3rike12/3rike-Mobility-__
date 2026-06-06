import { cn } from "@/lib/utils";

/** Base surface card. */
export function Card({
  className,
  hover,
  children,
  style,
}: {
  className?: string;
  hover?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={cn(
        "rounded-2xl border border-border bg-surface",
        hover && "card-hover",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Large section container with a header row (title + right-side actions). */
export function Panel({
  title,
  badge,
  actions,
  className,
  bodyClassName,
  children,
  style,
}: {
  title?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <section
      style={style}
      className={cn(
        "flex flex-col rounded-2xl border border-border bg-surface",
        className
      )}
    >
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 px-5 pt-5 sm:px-6">
          <div className="flex items-center gap-2.5">
            {title && (
              <h2 className="text-lg font-semibold tracking-tight text-text">
                {title}
              </h2>
            )}
            {badge}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn("flex-1 p-5 sm:p-6", bodyClassName)}>{children}</div>
    </section>
  );
}
