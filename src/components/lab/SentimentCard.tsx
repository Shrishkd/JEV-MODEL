"use client";

import { ProbBar, cn } from "@/components/ui";
import { LABELS, LABEL_DISPLAY, type SentimentResult } from "@/lib/lab/shared";

export function SentimentCard({
  title,
  tone,
  state,
  result,
  error,
  hint,
  timings,
  footer,
}: {
  title: React.ReactNode;
  tone: "jev" | "llm";
  state: "idle" | "loading" | "done" | "error";
  result?: SentimentResult;
  error?: string;
  hint?: string | null;
  timings?: [string, string][];
  footer?: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl border bg-surface p-5", tone === "jev" ? "border-jev/30" : "border-llm/30")}>
      <div className="flex items-center justify-between">
        <p className={cn("font-medium", tone === "jev" ? "text-jev-soft" : "text-llm-soft")}>{title}</p>
        {state === "loading" && <span className="text-xs text-ink-3">running…</span>}
      </div>
      {state === "idle" && <p className="mt-6 text-sm text-ink-3">Waiting for a run.</p>}
      {state === "loading" && <div className="shimmer mt-4 h-40 rounded-xl" />}
      {state === "error" && (
        <div className="mt-4 rounded-xl border border-critical/40 bg-critical/5 p-3 text-sm">
          <p className="text-[#f08a8a]">{error}</p>
          {hint && <p className="mt-2 text-ink-2">{hint}</p>}
        </div>
      )}
      {state === "done" && result && (
        <>
          <p className="mt-3 text-2xl font-semibold">
            {LABEL_DISPLAY[result.label]} <span className="text-base text-ink-3">· {result.stars}★</span>
          </p>
          <p className="text-xs text-ink-3">
            confidence <b className="font-mono text-ink">{result.confidence.toFixed(3)}</b>
          </p>
          <div className="mt-4 space-y-2">
            {LABELS.map((l, i) => (
              <ProbBar key={l} label={LABEL_DISPLAY[l]} value={result.probabilities[l] ?? 0} highlight={l === result.label} tone={tone} delay={i * 0.03} />
            ))}
          </div>
          {timings && (
            <dl className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
              {timings.map(([k, v]) => (
                <div key={k} className="rounded-lg bg-surface-2 px-2.5 py-1.5">
                  <dt className="text-ink-3">{k}</dt>
                  <dd className="font-mono text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          {footer}
        </>
      )}
    </div>
  );
}

export const ms = (v?: number) => (v === undefined || Number.isNaN(v) ? "—" : v >= 1000 ? `${(v / 1000).toFixed(2)} s` : `${Math.round(v)} ms`);
