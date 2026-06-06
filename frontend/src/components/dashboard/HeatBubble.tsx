"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { STATUS } from "@/lib/utils";
import type { HeatNode } from "@/lib/data";

export function HeatBubble({ node, index }: { node: HeatNode; index: number }) {
  const s = STATUS[node.status];
  const core = 16 + (node.demand / 100) * 30; // ~21..46px
  const halo = core * 2.6;
  const critical = node.status === "critical";
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  function show() {
    const r = ref.current?.getBoundingClientRect();
    if (r) setPos({ x: r.left + r.width / 2, y: r.top });
  }

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 animate-pop"
      style={{ left: `${node.x}%`, top: `${node.y}%`, animationDelay: `${300 + index * 80}ms` }}
    >
      {/* halo */}
      <span
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: halo,
          height: halo,
          background: `radial-gradient(circle, ${s.glow} 0%, transparent 68%)`,
          opacity: critical ? 0.9 : 0.6,
          animation: critical ? "breathe 2.4s ease-in-out infinite" : undefined,
        }}
      />
      {/* core */}
      <span
        ref={ref}
        onMouseEnter={show}
        onMouseLeave={() => setPos(null)}
        className="relative block cursor-pointer rounded-full ring-2 ring-white/85 transition-transform duration-300 hover:scale-110"
        style={{
          width: core,
          height: core,
          background: s.solid,
          boxShadow: `0 0 18px ${s.glow}`,
        }}
      />

      {/* tooltip — portaled to body so the plane's overflow never clips it */}
      {pos &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[200] -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-border bg-surface-3 px-2.5 py-1.5 text-center shadow-xl"
            style={{ left: pos.x, top: pos.y - 10 }}
          >
            <div className="text-[12px] font-semibold text-text">{node.name}</div>
            <div className="text-[11px]" style={{ color: s.solid }}>
              {node.demand}% demand · {s.label}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
