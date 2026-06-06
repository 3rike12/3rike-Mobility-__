import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-green text-[#06210f] font-semibold hover:bg-green-hover shadow-[0_0_20px_rgba(1,194,89,0.3)] hover:shadow-[0_0_28px_rgba(1,194,89,0.45)]",
  secondary:
    "border border-white/15 bg-white/[0.02] text-text hover:bg-white/[0.06] hover:border-white/25",
  ghost: "text-muted hover:text-text hover:bg-white/[0.05]",
};

export function Button({
  children,
  variant = "primary",
  className,
  type = "button",
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm transition-all duration-200 active:scale-[0.97]",
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </button>
  );
}
