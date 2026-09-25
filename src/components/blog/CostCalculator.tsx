"use client";

import { useState } from "react";
import { Card, Stat, cn } from "@/components/ui";
import { useCurrency } from "@/lib/currency";

// USD per 1M tokens. LLM list prices as used in the video (GPT-5: ₹119/₹956 per M ≈ $1.25/$10).
const MODELS = {
  "gpt-5": { name: "GPT-5 (as in the video)", input: 1.25, output: 10 },
  "gpt-5-mini": { name: "GPT-5 mini (small LLM)", input: 0.25, output: 2 },
} as const;
const JEV = { input: 0.042, output: 0 };

const VOLUMES = [100, 1_000, 10_000, 50_000, 100_000, 500_000, 1_000_000];

export function CostCalculator() {
  const { fmt, rate, setRate, currency } = useCurrency();
  const [volIdx, setVolIdx] = useState(2);
  const [inTok, setInTok] = useState(1000);
  const [outTok, setOutTok] = useState(200);
  const [model, setModel] = useState<keyof typeof MODELS>("gpt-5");

  const perDay = VOLUMES[volIdx];
  const m = MODELS[model];
  const llmPer = (inTok * m.input + outTok * m.output) / 1e6;
  const jevPer = (inTok * JEV.input) / 1e6;
  const ratio = llmPer / jevPer;
  const rows = [
    ["Per item", llmPer, jevPer],
    ["Per day", llmPer * perDay, jevPer * perDay],
    ["Per month", llmPer * perDay * 30, jevPer * perDay * 30],
    ["Per year", llmPer * perDay * 365, jevPer * perDay * 365],
  ] as const;
  const yearMax = rows[3][1];

  return (
    <Card>
      <h3 className="text-lg font-semibold">Cost calculator</h3>
      <p className="mt-1 text-sm text-ink-2">
        The video&apos;s scenario is classifying <b className="text-ink">10,000 emails a day</b> at about 1,000 input tokens each. That
        comes to ~₹11 lakh a year on GPT-5 versus ~₹14,000 on JEV. Change the numbers to fit your own workload. JEV&apos;s output
        tokens are free.
      </p>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-5">
          <Slider label="Items per day" value={perDay.toLocaleString("en-IN")} min={0} max={VOLUMES.length - 1} step={1} v={volIdx} onChange={setVolIdx} />
          <Slider label="Input tokens per item" value={inTok.toLocaleString()} min={100} max={8000} step={100} v={inTok} onChange={setInTok} />
          <Slider label="LLM output tokens per item (incl. reasoning)" value={outTok.toLocaleString()} min={0} max={2000} step={50} v={outTok} onChange={setOutTok} />
          <div>
            <p className="mb-2 text-sm text-ink-2">Compare against</p>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(MODELS) as (keyof typeof MODELS)[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setModel(k)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs",
                    model === k ? "border-llm/60 bg-llm/10 text-llm-soft" : "border-line bg-surface-2 text-ink-2 hover:text-ink",
                  )}
                >
                  {MODELS[k].name}
                </button>
              ))}
            </div>
          </div>
          {currency === "INR" && (
            <label className="flex items-center gap-2 text-xs text-ink-3">
              1 USD =
              <input
                type="number"
                min={50}
                max={150}
                value={rate}
                onChange={(e) => setRate(Math.max(1, Number(e.target.value) || 95))}
                className="w-16 rounded-md border border-line bg-surface-2 px-2 py-1 text-ink"
              />
              INR (the video&apos;s numbers imply ≈ ₹95)
            </label>
          )}
        </div>

        <div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label={`${m.name} · per year`} value={fmt(rows[3][1], { compact: true })} tone="llm" sub={`${fmt(m.input, { digits: 2 })} in / ${fmt(m.output, { digits: 2 })} out per 1M`} />
            <Stat label="JEV · per year" value={fmt(rows[3][2], { compact: true })} tone="jev" sub={`${fmt(JEV.input, { digits: 2 })} in / free out per 1M`} />
          </div>
          <p className="mt-4 text-center text-4xl font-semibold tabular-nums text-jev-soft">
            {ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1)}× cheaper
          </p>
          <div className="mt-4 overflow-hidden rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-xs text-ink-3">
                <tr>
                  <th className="px-3 py-2 text-left font-medium" />
                  <th className="px-3 py-2 text-right font-medium text-llm-soft">LLM</th>
                  <th className="px-3 py-2 text-right font-medium text-jev-soft">JEV</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([l, a, b]) => (
                  <tr key={l} className="border-t border-line">
                    <td className="px-3 py-2 text-ink-2">{l}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{fmt(a, { compact: true })}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{fmt(b, { compact: true })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Yearly bars on one shared axis */}
          <div className="mt-4 space-y-2" aria-hidden>
            {[
              ["LLM", rows[3][1], "bg-llm"],
              ["JEV", rows[3][2], "bg-jev"],
            ].map(([l, v, c]) => (
              <div key={l as string} className="grid grid-cols-[2.5rem_1fr] items-center gap-2 text-xs text-ink-3">
                {l}
                <div className="h-3 rounded-r bg-surface-3">
                  <div className={cn("h-full rounded-r", c as string)} style={{ width: `${Math.max(0.4, ((v as number) / yearMax) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs text-ink-3">
        List prices only. Real LLM bills also depend on caching, batching and retries, and a cheap LLM might be enough for some tasks.
        JEV&apos;s price is TypeSafe&apos;s published $0.042 per 1M input tokens.
      </p>
    </Card>
  );
}

function Slider({ label, value, min, max, step, v, onChange }: { label: string; value: string; min: number; max: number; step: number; v: number; onChange: (n: number) => void }) {
  return (
    <label className="block">
      <span className="flex justify-between text-sm">
        <span className="text-ink-2">{label}</span>
        <span className="font-mono tabular-nums">{value}</span>
      </span>
      <input type="range" className="mt-2 w-full" min={min} max={max} step={step} value={v} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}
