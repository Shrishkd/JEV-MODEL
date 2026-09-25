"use client";

import { useState } from "react";
import { percentile } from "@/lib/stats";

export type LatencySeries = { name: string; color: string; values: number[] };

/** One shared log-scale ms axis; one row of dots per series with p50/p95 ticks. */
export function LatencyStrip({ series: input }: { series: LatencySeries[] }) {
  const series = input.filter((s) => s.values.length > 0);
  const [hover, setHover] = useState<{ s: number; i: number } | null>(null);
  const all = series.flatMap((s) => s.values).filter((v) => v > 0);
  if (!all.length) return null;
  const lo = Math.max(1, Math.min(...all) * 0.8);
  const hi = Math.max(...all) * 1.2;
  const W = 640;
  const rowH = 46;
  const pad = { l: 92, r: 14, t: 8, b: 30 };
  const H = pad.t + rowH * series.length + pad.b;
  const x = (v: number) => pad.l + ((Math.log10(v) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo))) * (W - pad.l - pad.r);
  const ticks = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000].filter((t) => t >= lo && t <= hi);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Latency distribution per model">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={pad.t} y2={H - pad.b} stroke="var(--color-line)" />
            <text x={x(t)} y={H - pad.b + 14} fontSize="10" textAnchor="middle" fill="var(--color-ink-3)">
              {t >= 1000 ? `${t / 1000}s` : `${t}ms`}
            </text>
          </g>
        ))}
        <text x={(W + pad.l) / 2} y={H - 2} fontSize="10" textAnchor="middle" fill="var(--color-ink-2)">
          round-trip latency (log scale)
        </text>
        {series.map((s, si) => {
          const cy = pad.t + rowH * si + rowH / 2;
          const p50 = percentile(s.values, 0.5);
          const p95 = percentile(s.values, 0.95);
          return (
            <g key={s.name}>
              <text x={pad.l - 10} y={cy + 4} fontSize="11" textAnchor="end" fill="var(--color-ink-2)">
                {s.name}
              </text>
              {s.values.map((v, i) => (
                <circle
                  key={i}
                  cx={x(v)}
                  cy={cy + (((i * 37) % 11) - 5) * 1.6}
                  r={hover?.s === si && hover.i === i ? 5 : 3.5}
                  fill={s.color}
                  fillOpacity={0.75}
                  stroke="var(--color-surface)"
                  strokeWidth="1"
                  onMouseEnter={() => setHover({ s: si, i })}
                  onMouseLeave={() => setHover(null)}
                />
              ))}
              {[
                ["p50", p50],
                ["p95", p95],
              ].map(([l, v]) => (
                <g key={l as string}>
                  <line x1={x(v as number)} x2={x(v as number)} y1={cy - 15} y2={cy + 15} stroke="var(--color-ink)" strokeWidth="2" />
                  <text x={x(v as number)} y={cy - 18} fontSize="9" textAnchor="middle" fill="var(--color-ink)">
                    {l}
                  </text>
                </g>
              ))}
            </g>
          );
        })}
      </svg>
      {hover && (
        <div className="pointer-events-none absolute right-2 top-0 rounded-lg border border-line-2 bg-surface-3 px-2.5 py-1 text-xs">
          {series[hover.s].name}: <b className="font-mono">{Math.round(series[hover.s].values[hover.i])} ms</b>
        </div>
      )}
    </div>
  );
}
