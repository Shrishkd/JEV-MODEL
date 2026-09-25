"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Button, Card, ProbBar, SimBadge } from "@/components/ui";

const OPTIONS = ["billing", "shipping", "technical", "general"];

// Realistic failure modes of free-text / loosely-structured LLM outputs.
const LLM_OUTPUTS = [
  { text: "Shipping", ok: true, note: "valid (after lower-casing)" },
  { text: "Returns & Refunds", ok: false, note: "invented a category" },
  { text: '```json\n{"category": "shipping"}\n```', ok: false, note: "wrapped in markdown" },
  { text: "This looks like it could be shipping or billing.", ok: false, note: "hedged prose" },
  { text: "shipping", ok: true, note: "valid" },
  { text: "Category: Shipping/Logistics", ok: false, note: "near-miss label" },
];

export function NoHallucination() {
  const [n, setN] = useState(0);
  const shown = LLM_OUTPUTS.slice(0, n);
  const valid = shown.filter((o) => o.ok).length;

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold">It can&apos;t hallucinate a label</h3>
          <SimBadge />
        </div>
        <Button onClick={() => setN((x) => (x >= LLM_OUTPUTS.length ? 1 : x + 1))}>
          {n >= LLM_OUTPUTS.length ? "Reset" : `Ask both (run ${n + 1}/6)`}
        </Button>
      </div>
      <p className="mt-2 text-sm text-ink-2">
        Question: <i>&ldquo;My package arrived damaged and I want a refund.&rdquo; Which category is it: billing, shipping, technical or
        general?</i> An LLM writes an answer, so it can drift. Structured outputs reduce this but don&apos;t guarantee it, especially
        on smaller models. JEV only assigns probabilities to <b className="text-ink">your</b> options, so there is nothing to parse.
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-llm/30 bg-surface-2 p-4">
          <p className="text-sm font-medium text-llm-soft">LLM · free-text output</p>
          <div className="mt-3 min-h-[15rem] space-y-2">
            <AnimatePresence>
              {shown.map((o, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-start justify-between gap-3 rounded-lg bg-surface-3/60 px-3 py-2">
                  <pre className="whitespace-pre-wrap font-mono text-xs text-ink">{o.text}</pre>
                  <span className={`shrink-0 text-[11px] ${o.ok ? "text-[#5fd35f]" : "text-[#f08a8a]"}`}>
                    {o.ok ? "✓" : "✗"} {o.note}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            {!n && <p className="text-sm text-ink-3">Press the button to sample answers…</p>}
          </div>
          {n > 0 && (
            <p className="mt-3 text-xs text-ink-2">
              Parser success: <b className="font-mono text-ink">{valid}/{n}</b>. Each ✗ needs regex, retries or a fallback.
            </p>
          )}
        </div>
        <div className="rounded-xl border border-jev/30 bg-surface-2 p-4">
          <p className="text-sm font-medium text-jev-soft">JEV · typed output</p>
          <div className="mt-3 min-h-[15rem] space-y-3">
            {n > 0 ? (
              <>
                {OPTIONS.map((o, i) => (
                  <ProbBar key={o + n} label={o} value={[0.22, 0.71, 0.04, 0.03][i]} highlight={o === "shipping"} delay={i * 0.04} />
                ))}
                <p className="pt-2 font-mono text-xs text-jev-soft">choice = &quot;shipping&quot; · identical on every run</p>
              </>
            ) : (
              <p className="text-sm text-ink-3">Waiting…</p>
            )}
          </div>
          {n > 0 && (
            <p className="mt-3 text-xs text-ink-2">
              Parser success: <b className="font-mono text-ink">{n}/{n}</b>. The answer is chosen from your options by construction.
            </p>
          )}
        </div>
      </div>
      <p className="mt-4 text-xs text-ink-3">
        &ldquo;Can&apos;t hallucinate&rdquo; means it can&apos;t invent an <i>invalid</i> answer. It can still pick the <i>wrong</i> option.
        That is what the confidence score is for.
      </p>
    </Card>
  );
}
