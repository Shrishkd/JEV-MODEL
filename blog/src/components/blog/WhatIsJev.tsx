"use client";

import { useMemo, useState } from "react";
import { Card, CodeBlock, ProbBar, Reveal, Section, SimBadge, Tabs } from "@/components/ui";
import { simulateChoice, type Option } from "@/lib/sim/pseudoJev";

const PRESETS = [
  "My package arrived damaged and I want a refund.",
  "I was charged twice for the same order this month.",
  "The app crashes every time I open the camera screen.",
  "What are your store opening hours on Sunday?",
  "Mera order 5 din se deliver nahi hua, kab aayega?",
];

const DEFAULT_OPTIONS: Option[] = [
  { key: "billing", label: "billing", keywords: ["charge", "charged", "payment", "invoice", "refund", "money", "card", "paisa", "paid"] },
  { key: "shipping", label: "shipping", keywords: ["package", "delivery", "deliver", "arrived", "damaged", "courier", "order", "late", "aayega"] },
  { key: "technical", label: "technical", keywords: ["app", "crash", "crashes", "bug", "error", "login", "screen", "update"] },
  { key: "general", label: "general", keywords: ["hours", "store", "question", "info", "where", "when", "open"] },
];

export function WhatIsJev() {
  const [text, setText] = useState(PRESETS[0]);
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [newOpt, setNewOpt] = useState("");
  const [view, setView] = useState<"bars" | "json">("bars");

  const result = useMemo(() => (text.trim() && options.length >= 2 ? simulateChoice(text, options) : null), [text, options]);
  const sorted = result ? [...options].sort((a, b) => result.probabilities[b.key] - result.probabilities[a.key]) : [];

  return (
    <Section
      id="what"
      eyebrow="01 · The basics"
      title="What is JEV?"
      lead={
        <>
          TypeSafe describes it as <i>&ldquo;an AI model built to make fast, structured decisions that software can use directly.&rdquo;</i> In
          classic machine-learning terms JEV is a <b className="text-ink">classifier</b>, like logistic regression. The difference is that it
          is <b className="text-ink">general</b>. You never train it on your data. You describe the options in plain English and it picks one.
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Not an LLM", "An LLM generates text one token at a time. JEV never generates text. It returns typed values: a choice, a score, or a yes/no probability."],
          ["A decision model", "Input is state (text, JSON, logs, a chat history) plus questions. Output is a probability for each allowed answer and a calibrated confidence."],
          ["Classification as a service", "Before JEV, a classifier meant collect data → train → deploy. With JEV you send a question with its options and get the prediction back. No training or fine-tuning."],
        ].map(([t, d], i) => (
          <Reveal key={t} delay={i * 0.06}>
            <Card className="h-full">
              <p className="font-mono text-xs text-jev-soft">0{i + 1}</p>
              <h3 className="mt-2 text-lg font-semibold">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{d}</p>
            </Card>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <Card className="mt-8 grid gap-6 lg:grid-cols-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold">Try it: route a support ticket</h3>
              <SimBadge />
            </div>
            <p className="mt-1 text-sm text-ink-2">
              This is the video&apos;s example. Edit the message, or <b className="text-ink">add your own option</b>. JEV has no fixed label
              set, so the options are whatever you send it.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setText(p)}
                  className="max-w-[16rem] truncate rounded-full border border-line bg-surface-2 px-3 py-1 text-xs text-ink-2 hover:border-jev/50 hover:text-ink"
                >
                  {p}
                </button>
              ))}
            </div>
            <label className="mt-4 block font-mono text-[11px] uppercase tracking-wider text-ink-3" htmlFor="ticket">
              state
            </label>
            <textarea
              id="ticket"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              className="mt-1 w-full resize-none rounded-xl border border-line bg-surface-2 p-3 text-sm outline-none focus:border-jev/60"
            />
            <p className="mt-4 font-mono text-[11px] uppercase tracking-wider text-ink-3">question: which queue should handle this?</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {options.map((o) => (
                <span key={o.key} className="inline-flex items-center gap-1 rounded-lg border border-line-2 bg-surface-2 py-1 pl-2.5 pr-1 text-xs">
                  {o.label}
                  <button
                    aria-label={`Remove ${o.label}`}
                    disabled={options.length <= 2}
                    onClick={() => setOptions((xs) => xs.filter((x) => x.key !== o.key))}
                    className="rounded px-1 text-ink-3 hover:text-critical disabled:opacity-30"
                  >
                    ×
                  </button>
                </span>
              ))}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const k = newOpt.trim().toLowerCase().replace(/\s+/g, "_");
                  if (!k || options.some((o) => o.key === k) || options.length >= 8) return;
                  setOptions((xs) => [...xs, { key: k, label: k, keywords: newOpt.toLowerCase().split(/\W+/) }]);
                  setNewOpt("");
                }}
              >
                <input
                  value={newOpt}
                  onChange={(e) => setNewOpt(e.target.value)}
                  placeholder="+ add option (e.g. refunds)"
                  className="w-44 rounded-lg border border-dashed border-line-2 bg-transparent px-2.5 py-1 text-xs outline-none focus:border-jev/60"
                />
              </form>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <Tabs
                value={view}
                onChange={setView}
                tabs={[
                  { id: "bars", label: "Answer" },
                  { id: "json", label: "Raw response" },
                ]}
              />
              {result && (
                <span className="text-xs text-ink-3">
                  confidence <b className="font-mono text-ink">{result.confidence.toFixed(2)}</b>
                </span>
              )}
            </div>
            <div className="mt-4 flex-1">
              {!result ? (
                <p className="text-sm text-ink-3">Type a message and keep at least two options.</p>
              ) : view === "bars" ? (
                <div className="space-y-3">
                  {sorted.map((o, j) => (
                    <ProbBar key={o.key + text} label={o.label} value={result.probabilities[o.key]} highlight={j === 0} delay={j * 0.04} />
                  ))}
                  <p className="pt-3 text-sm text-ink-2">
                    → Route to <b className="text-jev-soft">{result.choice}</b>. The answer is always one of your options. It can&apos;t
                    return a label you didn&apos;t send.
                  </p>
                </div>
              ) : (
                <CodeBlock
                  lang="json · TypeSafe response shape"
                  code={JSON.stringify(
                    { model: "jev-latest", answers: { queue: { type: "choice", choice: result.choice, confidence: result.confidence, probabilities: result.probabilities } }, usage: { input_tokens: 96, output_tokens: 0 } },
                    null,
                    2,
                  )}
                />
              )}
            </div>
          </div>
        </Card>
      </Reveal>
    </Section>
  );
}
