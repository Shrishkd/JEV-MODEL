"use client";

import { useRef, useState } from "react";
import { Button, Card, Pill } from "@/components/ui";
import { useCurrency } from "@/lib/currency";
import { LabError, callBert, callJev, newRunId, type Timed } from "@/lib/lab/client";
import type { BertSentimentResponse, JevSentimentResponse } from "@/lib/lab/shared";
import { LABEL_DISPLAY } from "@/lib/lab/shared";
import { jevHint, type Health } from "./Lab";
import { SentimentCard, ms } from "./SentimentCard";

const SAMPLES = [
  "Battery life is amazing but the camera is blurry in low light. Decent for the price.",
  "Phone ekdum badhiya hai, camera mast hai, full paisa vasool.",
  "Oh great, another update that drains my battery by noon. Just what I needed.",
  "Not bad at all, actually better than I expected.",
  "Worst phone ever. Heats up, lags, and support never replied.",
];

type Side<T> = { state: "idle" | "loading" | "done" | "error"; res?: Timed<T>; error?: string; code?: string };
type Run = { text: string; bert?: number; jev?: number; bertLabel?: string; jevLabel?: string };

export function RaceTab({ health }: { health: Health | null }) {
  const [text, setText] = useState(SAMPLES[0]);
  const [bert, setBert] = useState<Side<BertSentimentResponse>>({ state: "idle" });
  const [jev, setJev] = useState<Side<JevSentimentResponse>>({ state: "idle" });
  const [runs, setRuns] = useState<Run[]>([]);
  const ctrl = useRef<AbortController | null>(null);
  const { fmt } = useCurrency();

  const run = async () => {
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setBert({ state: "loading" });
    setJev({ state: "loading" });
    const rec: Run = { text };
    // Fire both at the same instant.
    const b = callBert(text, c.signal).then(
      (res) => {
        setBert({ state: "done", res });
        rec.bert = res.client_ms;
        rec.bertLabel = res.data.label;
      },
      (e: LabError) => setBert({ state: "error", error: e.message, code: e.code }),
    );
    const j = callJev(text, newRunId(), c.signal).then(
      (res) => {
        setJev({ state: "done", res });
        rec.jev = res.client_ms;
        rec.jevLabel = res.data.label;
      },
      (e: LabError) => setJev({ state: "error", error: e.message, code: e.code }),
    );
    await Promise.allSettled([b, j]);
    if (!c.signal.aborted) setRuns((r) => [rec, ...r].slice(0, 8));
  };

  const busy = bert.state === "loading" || jev.state === "loading";
  const both = bert.state === "done" && jev.state === "done";
  const agree = both && bert.res!.data.label === jev.res!.data.label;

  return (
    <div className="space-y-6">
      <Card>
        <label htmlFor="race-text" className="text-sm font-medium">
          Review text
        </label>
        <textarea
          id="race-text"
          rows={3}
          value={text}
          maxLength={4000}
          onChange={(e) => setText(e.target.value)}
          className="mt-2 w-full resize-y rounded-xl border border-line bg-surface-2 p-3 text-sm outline-none focus:border-jev/60"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {SAMPLES.map((s) => (
            <button key={s} onClick={() => setText(s)} className="max-w-[15rem] truncate rounded-full border border-line bg-surface-2 px-3 py-1 text-xs text-ink-2 hover:text-ink">
              {s}
            </button>
          ))}
          <Button className="ml-auto" onClick={run} disabled={busy || !text.trim()}>
            {busy ? "Running both…" : "Run both ▶"}
          </Button>
        </div>
        {health?.jev.id === "mock" && (
          <p className="mt-3 text-xs text-warn">
            JEV is in MOCK mode (no key). Its output is an imitation, so don&apos;t draw conclusions from it. See Setup.
          </p>
        )}
      </Card>

      {both && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface p-3 text-sm">
          <Pill tone={agree ? "good" : "warn"}>{agree ? "✓ Both agree" : "≠ They disagree"}</Pill>
          <span className="text-ink-2">
            Round trip: BERT <b className="font-mono text-ink">{ms(bert.res!.client_ms)}</b> · JEV{" "}
            <b className="font-mono text-ink">{ms(jev.res!.client_ms)}</b>
            {" · "}
            {bert.res!.client_ms < jev.res!.client_ms ? "BERT" : "JEV"} was{" "}
            {(Math.max(bert.res!.client_ms, jev.res!.client_ms) / Math.max(1, Math.min(bert.res!.client_ms, jev.res!.client_ms))).toFixed(1)}× faster
          </span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <SentimentCard
          title="BERT · Moodify model"
          tone="llm"
          state={bert.state}
          result={bert.res?.data}
          error={bert.error}
          timings={
            bert.res && [
              ["browser round trip", ms(bert.res.client_ms)],
              ["server → BERT", ms(bert.res.data.upstream_ms)],
              ["forward pass", bert.res.data.timings ? ms(bert.res.data.timings.inference_ms) : "n/a (hosted)"],
              ["tokenize", bert.res.data.timings ? ms(bert.res.data.timings.tokenize_ms) : "n/a (hosted)"],
              ["runs on", bert.res.data.device],
              ["cost", bert.res.data.timings ? "self-hosted" : "HF credits"],
            ]
          }
        />
        <SentimentCard
          title={`JEV · ${jev.res?.data.provider === "mock" ? "MOCK" : jev.res?.data.model ?? health?.jev.model ?? ""}`}
          tone="jev"
          state={jev.state}
          result={jev.res?.data}
          error={jev.error}
          hint={jev.error ? jevHint(jev.error, jev.code) : null}
          timings={
            jev.res && [
              ["browser round trip", ms(jev.res.client_ms)],
              ["server → JEV", ms(jev.res.data.upstream_ms)],
              ["input tokens", String(jev.res.data.usage.input_tokens)],
              ["output tokens", String(jev.res.data.usage.output_tokens)],
              ["provider", jev.res.data.provider],
              ["cost", fmt(jev.res.data.cost_usd ?? (jev.res.data.usage.input_tokens * 0.042) / 1e6, { digits: 6 })],
            ]
          }
        />
      </div>

      {runs.length > 0 && (
        <Card className="overflow-x-auto p-0 sm:p-0">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-surface-2 text-left text-xs text-ink-3">
              <tr>
                <th className="px-4 py-2 font-medium">Recent runs</th>
                <th className="px-4 py-2 font-medium text-llm-soft">BERT</th>
                <th className="px-4 py-2 font-medium text-jev-soft">JEV</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r, i) => (
                <tr key={i} className="border-t border-line">
                  <td className="max-w-xs truncate px-4 py-2 text-ink-2">{r.text}</td>
                  <td className="px-4 py-2 font-mono text-xs">
                    {r.bertLabel ? `${LABEL_DISPLAY[r.bertLabel as keyof typeof LABEL_DISPLAY]} · ${ms(r.bert)}` : "error"}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">
                    {r.jevLabel ? `${LABEL_DISPLAY[r.jevLabel as keyof typeof LABEL_DISPLAY]} · ${ms(r.jev)}` : "error"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <p className="text-xs leading-relaxed text-ink-3">
        <b className="text-ink-2">Reading the numbers fairly:</b> BERT runs on your machine (no network hop), while JEV is a remote API.
        Locally, a 110M-parameter BERT will often <i>win on raw latency</i>. JEV&apos;s case against BERT is no training, new labels
        in plain English, world knowledge (sarcasm, Hinglish) and calibrated confidence. Its case against <i>LLMs</i> is speed and cost.
        The Benchmark tab measures these properly.
      </p>
    </div>
  );
}
