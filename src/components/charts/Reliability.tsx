"use client";

import { useState } from "react";
import type { Bin } from "@/lib/stats";

export type ReliabilitySeries = { name: string; color: string; bins: Bin[] };

/** Reliability diagram: stated confidence (x) vs observed accuracy (y), 0–1 on both axes. */
export function Reliability({ series }: { series: ReliabilitySeries[] }) {
  const [hover, setHover] = useState<{ s: number; b: number } | null>(null);
  const W = 340;
  const H = 260;
  const pad = { l: 38, r: 10, t: 10, b: 34 };
  const x = (v: number) => pad.l + v * (W - pad.l - pad.r);
  const y = (v: number) => H - pad.b - v * (H - pad.t - pad.b);
  const hb = hover ? series[hover.s].bins[hover.b] : null;

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-4 text-xs text-ink-2">
        {series.map((s) => (
          <span key={s.name} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} /> {s.name}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 border-t border-dashed border-ink-3" /> perfectly calibrated
        </span>
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Reliability diagram">
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <g key={v}>
              <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="var(--color-line)" />
              <text x={pad.l - 5} y={y(v) + 3} fontSize="9" textAnchor="end" fill="var(--color-ink-3)">
                {v * 100}%
              </text>
              <text x={x(v)} y={H - pad.b + 13} fontSize="9" textAnchor="middle" fill="var(--color-ink-3)">
                {v * 100}%
              </text>
            </g>
          ))}
          <text x={(W + pad.l) / 2} y={H - 3} fontSize="10" textAnchor="middle" fill="var(--color-ink-2)">
            stated confidence
          </text>
          <line x1={x(0)} y1={y(0)} x2={x(1)} y2={y(1)} stroke="var(--color-ink-3)" strokeDasharray="4 4" />
          {series.map((s, si) => {
            const pts = s.bins.map((b, bi) => ({ b, bi })).filter(({ b }) => b.count > 0);
            return (
              <g key={s.name}>
                <polyline fill="none" stroke={s.color} strokeWidth="2" points={pts.map(({ b }) => `${x(b.avgConf)},${y(b.accuracy)}`).join(" ")} />
                {pts.map(({ b, bi }) => (
                  <g key={bi}>
                    <circle cx={x(b.avgConf)} cy={y(b.accuracy)} r={Math.min(9, 3.5 + Math.sqrt(b.count))} fill={s.color} stroke="var(--color-surface)" strokeWidth="2" />
                    <circle cx={x(b.avgConf)} cy={y(b.accuracy)} r="13" fill="transparent" onMouseEnter={() => setHover({ s: si, b: bi })} onMouseLeave={() => setHover(null)} />
                  </g>
                ))}
              </g>
            );
          })}
        </svg>
        {hover && hb && (
          <div
            className="pointer-events-none absolute z-10 rounded-lg border border-line-2 bg-surface-3 px-2.5 py-1.5 text-xs shadow-lg"
            style={{ left: `${(x(hb.avgConf) / W) * 100}%`, top: `${(y(hb.accuracy) / H) * 100}%`, transform: "translate(-50%, -125%)" }}
          >
            <p className="font-medium">{series[hover.s].name}</p>
            <p className="text-ink-2">
              said ~{Math.round(hb.avgConf * 100)}% → right {Math.round(hb.accuracy * 100)}% · n={hb.count}
            </p>
          </div>
        )}
      </div>
      <p className="mt-1 text-[11px] text-ink-3">Dot size = number of reviews in that confidence bin.</p>
    </div>
  );
}
