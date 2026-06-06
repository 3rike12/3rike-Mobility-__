import Link from "next/link";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("group flex items-center gap-2.5", className)}
      aria-label="3rike Swap — home"
    >
      <span className="relative grid size-9 place-items-center rounded-xl bg-green shadow-[0_0_22px_rgba(1,194,89,0.45)] transition-transform duration-300 group-hover:scale-105">
        <Zap className="size-5 fill-[#06210f] text-[#06210f]" strokeWidth={2} />
        <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
      </span>
      <span className="text-[17px] font-bold leading-none tracking-tight text-text">
        3rike <span className="text-green">Swap</span>
      </span>
    </Link>
  );
}
