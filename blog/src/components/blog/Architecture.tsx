"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Button, Card, Pill, Reveal, Section, Tabs, cn } from "@/components/ui";

const EVIDENCE: { fact: string; status: "confirmed" | "reported" | "inferred"; note: string }[] = [
  { fact: "Non-autoregressive", status: "confirmed", note: "“a parallel sampler that generates all outputs in a single query rather than autoregressively” (TypeSafe)." },
  { fact: "Schema-constrained output", status: "confirmed", note: "Only Choice / Score / Noul values you declare. 0% structured-output errors reported." },
  { fact: "Parallel questions", status: "confirmed", note: "All questions on a state are answered at once. Adding questions barely changes cost or time." },
  { fact: "Calibrated confidence via RLCD", status: "confirmed", note: "Reinforcement Learning for Calibrated Decisions. Details unpublished." },
  { fact: "Transformer-based", status: "reported", note: "Widely reported. TypeSafe only says “a new model architecture”." },
  { fact: "Trained on synthetic data", status: "reported", note: "Mentioned in the video as stated by TypeSafe. The data itself isn't disclosed." },
  { fact: "Broad world knowledge (MMLU-Pro ≈ 84.6%)", status: "reported", note: "Archer Hume's probe (~10,000 API calls, 17 Sept) also measured ECE 0.031 on 1,200 items. The video calls it “MMLU”. Not independently replicated." },
  { fact: "Shared state, isolated question branches", status: "reported", note: "Same probe: the state is encoded once, questions can't attend to each other, and a readout layer emits probabilities directly." },
  { fact: "Decoder backbone + custom answer head", status: "inferred", note: "The explanation that best fits everything above. Speculation until a paper appears." },
];

const STATUS_TONE = { confirmed: "good", reported: "warn", inferred: "neutral" } as const;

export function Architecture() {
  return (
    <Section
      id="architecture"
      eyebrow="07 · Under the hood (speculative)"
      title="How might JEV work inside?"
      lead={
        <>
          TypeSafe has published <b className="text-ink">no paper, dataset or methodology</b>. What follows is the video&apos;s
          reverse-engineering, tidied up. Each claim is labelled with how sure we can be. You don&apos;t need any of this to{" "}
          <i>use</i> JEV, which is just an API call, but it explains why JEV is so fast.
        </>
      }
    >
      <div className="space-y-6">
        <Reveal>
          <Card>
            <h3 className="text-lg font-semibold">What we actually know</h3>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {EVIDENCE.map((e) => (
                <div key={e.fact} className="flex gap-3 rounded-xl border border-line bg-surface-2 p-3">
                  <Pill tone={STATUS_TONE[e.status]} className="h-fit shrink-0">
                    {e.status}
                  </Pill>
                  <div>
                    <p className="text-sm font-medium">{e.fact}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-2">{e.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>

        <Reveal>
          <PrefillDecode />
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal>
            <ParallelPrefill />
          </Reveal>
          <Reveal delay={0.06}>
            <Card className="h-full">
              <h3 className="text-lg font-semibold">The likely training recipe</h3>
              <ol className="mt-4 space-y-3">
                {[
                  ["Take a pre-trained decoder", "An open model such as a Qwen-family LLM already has world knowledge, which explains the MMLU score without new pre-training."],
                  ["Keep the layers that understand input", "The transformer stack that does prefill: reading and encoding state + question."],
                  ["Swap the LM head for an answer head", "Score only the K options you sent instead of 100k+ vocabulary tokens. One pass, no loop."],
                  ["Supervised training on synthetic decisions", "Millions of generated (state, question, options → correct answer) examples. This fits the “synthetic data only” claim, since pre-training needs real web data."],
                  ["RLCD for calibration", "Reward honest probabilities so the confidence number means something."],
                ].map(([h, d], i) => (
                  <li key={h} className="flex gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-jev/15 font-mono text-xs text-jev-soft">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium">{h}</p>
                      <p className="text-xs leading-relaxed text-ink-2">{d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-4 rounded-lg border border-warn/30 bg-warn/5 p-3 text-xs text-ink-2">
                <b className="text-warn">Model size is unknown.</b> The video guesses both &ldquo;30–70B-class intelligence&rdquo; and
                &ldquo;under a billion parameters&rdquo;. Archer Hume measured ~30k tokens in ~160 ms, which points to a sparse mixture-of-experts
                backbone. Open clones on JevBench use ~4B backbones. Anything in that range is
                plausible given the 70–500 ms latency.
              </p>
            </Card>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}

/* ---------------- Prefill / decode animation ---------------- */

const LLM_TOKENS = ["The", " capital", " of", " India", " is", " New", " Delhi", "."];

function PrefillDecode() {
  const [mode, setMode] = useState<"llm" | "jev">("llm");
  const [step, setStep] = useState(-1);
  const [started, setPlaying] = useState(false);
  const maxStep = mode === "llm" ? LLM_TOKENS.length + 1 : 2;
  const playing = started && step < maxStep;

  useEffect(() => {
    if (!playing || step >= maxStep) return;
    const id = setTimeout(() => setStep((s) => s + 1), mode === "llm" ? (step < 0 ? 700 : 480) : 700);
    return () => clearTimeout(id);
  }, [playing, step, maxStep, mode]);

  const play = () => {
    setStep(-1);
    setPlaying(true);
  };
  const prefillOn = step >= 0;
  const passes = mode === "llm" ? Math.max(0, Math.min(step, LLM_TOKENS.length)) : step >= 1 ? 1 : 0;

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Prefill → decode vs prefill → answer head</h3>
          <p className="mt-1 text-sm text-ink-2">
            LLM inference has two stages. <b className="text-ink">Prefill</b> reads the whole prompt in parallel and builds the
            key/value cache. <b className="text-ink">Decode</b> then produces one token per forward pass in a loop. JEV (probably) keeps
            the prefill and replaces the loop with a single softmax over <i>your</i> options.
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Tabs
          value={mode}
          onChange={(m) => {
            setMode(m);
            setStep(-1);
            setPlaying(false);
          }}
          tabs={[
            { id: "llm", label: "Typical LLM" },
            { id: "jev", label: "JEV (hypothesis)" },
          ]}
        />
        <Button onClick={play} disabled={playing}>
          ▶ {step >= 0 && !playing ? "Replay" : "Play"}
        </Button>
        <span className="font-mono text-xs text-ink-3">
          decode passes: <b className={mode === "llm" ? "text-llm-soft" : "text-jev-soft"}>{passes}</b>
        </span>
      </div>

      <div className="mt-6 grid items-stretch gap-3 md:grid-cols-[1fr_auto_1.1fr_auto_1.3fr]">
        {/* Input */}
        <Box title="input" active={prefillOn}>
          <p className="font-mono text-xs leading-relaxed">
            {mode === "llm" ? (
              "What is the capital of India?"
            ) : (
              <>
                state: &ldquo;What is the capital of India?&rdquo;
                <br />
                options: Mumbai · Chennai · Delhi · Kolkata
              </>
            )}
          </p>
        </Box>
        <Arrow on={prefillOn} />
        {/* Transformer */}
        <Box title="transformer layers · prefill" active={prefillOn} tone={mode}>
          <div className="grid grid-cols-6 gap-1">
            {Array.from({ length: 18 }, (_, i) => (
              <motion.span
                key={i}
                className={cn("h-3 rounded-sm", mode === "llm" ? "bg-llm" : "bg-jev")}
                animate={{ opacity: prefillOn ? [0.15, 0.9, 0.35] : 0.12 }}
                transition={{ duration: 0.6, delay: (i % 6) * 0.05 + Math.floor(i / 6) * 0.1, repeat: playing ? Infinity : 0, repeatDelay: 0.3 }}
              />
            ))}
          </div>
          <p className="mt-2 text-[11px] text-ink-3">builds K/V vectors = &ldquo;understands the question&rdquo;</p>
        </Box>
        <Arrow on={step >= 1} />
        {/* Head */}
        {mode === "llm" ? (
          <Box title="LM head · softmax over ~100k tokens → loop" active={step >= 1} tone="llm">
            <div className="flex min-h-[3.5rem] flex-wrap items-start gap-1 font-mono text-sm">
              <AnimatePresence>
                {LLM_TOKENS.slice(0, Math.max(0, Math.min(step, LLM_TOKENS.length))).map((t, i) => (
                  <motion.span key={i} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="rounded bg-llm/15 px-1 text-llm-soft">
                    {t.trim() || "·"}
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
            <p className="mt-2 text-[11px] text-ink-3">each token = one more forward pass, fed back as input ↺</p>
          </Box>
        ) : (
          <Box title="answer head · softmax over 4 options" active={step >= 1} tone="jev">
            <div className="space-y-1.5">
              {[
                ["Delhi", 0.97],
                ["Mumbai", 0.02],
                ["Kolkata", 0.007],
                ["Chennai", 0.003],
              ].map(([o, p], i) => (
                <div key={o as string} className="grid grid-cols-[4rem_1fr_2.5rem] items-center gap-2 text-xs">
                  <span className={i === 0 ? "text-ink" : "text-ink-3"}>{o}</span>
                  <div className="h-2 rounded-full bg-surface-3">
                    <motion.div className="h-full rounded-full bg-jev" animate={{ width: step >= 1 ? `${Math.max(2, (p as number) * 100)}%` : "0%" }} style={{ opacity: i === 0 ? 1 : 0.45 }} />
                  </div>
                  <span className="text-right font-mono text-ink-3">{step >= 1 ? (p as number).toFixed(2) : ""}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-ink-3">one pass, done · probabilities sum to 1</p>
          </Box>
        )}
      </div>
      <p className="mt-4 text-sm text-ink-2">
        {mode === "llm"
          ? "8 tokens took 8 sequential decode passes, and a reasoning model adds hundreds of hidden ‘thinking’ tokens first. The answer can also be anything in the vocabulary, including a wrong city or a paragraph."
          : "One pass, and the only possible outputs are the options you supplied. This one change explains the speed, the low cost (no output tokens), the schema guarantee and the ‘can't hallucinate’ property."}
      </p>
    </Card>
  );
}

function Box({ title, active, tone, children }: { title: string; active: boolean; tone?: "llm" | "jev"; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-surface-2 p-3 transition-colors duration-500",
        active ? (tone === "llm" ? "border-llm/50" : tone === "jev" ? "border-jev/50" : "border-line-2") : "border-line",
      )}
    >
      <p className="mb-2 font-mono text-[10.5px] uppercase tracking-wider text-ink-3">{title}</p>
      {children}
    </div>
  );
}

function Arrow({ on }: { on: boolean }) {
  return (
    <div className="flex items-center justify-center py-1 md:py-0">
      <svg width="28" height="16" viewBox="0 0 28 16" className="rotate-90 md:rotate-0" aria-hidden>
        <path d="M1 8h22m-6-6 6 6-6 6" fill="none" stroke={on ? "var(--color-jev-soft)" : "var(--color-line-2)"} strokeWidth="1.8" className="transition-colors duration-500" />
      </svg>
    </div>
  );
}

/* ---------------- Parallel prefill ---------------- */

function ParallelPrefill() {
  const [k, setK] = useState(0);
  const qs = ["Q1 · which queue?", "Q2 · urgent?", "Q3 · refund?", "Q4 · language?"];
  return (
    <Card className="h-full">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">The parallel sampler</h3>
        <Button variant="outline" onClick={() => setK((x) => x + 1)}>
          Animate
        </Button>
      </div>
      <p className="mt-1 text-sm text-ink-2">
        One plausible design: encode the shared context <b className="text-ink">once</b>, then run every question as an independent
        branch on top of that cached context. Questions can&apos;t see each other&apos;s answers, which is why TypeSafe says they&apos;re
        answered &ldquo;in isolation&rdquo;.
      </p>
      <svg viewBox="0 0 360 210" className="mt-4 w-full" aria-hidden key={k}>
        <motion.rect x="8" y="80" width="100" height="50" rx="10" fill="var(--color-jev)" fillOpacity="0.12" stroke="var(--color-jev)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
        <text x="58" y="101" textAnchor="middle" fontSize="11" fill="var(--color-ink)">
          context
        </text>
        <text x="58" y="117" textAnchor="middle" fontSize="9" fill="var(--color-ink-3)">
          KV cache · computed once
        </text>
        {qs.map((q, i) => {
          const y = 20 + i * 50;
          return (
            <g key={q}>
              <motion.path
                d={`M108 105 C150 105 150 ${y + 15} 190 ${y + 15}`}
                fill="none"
                stroke="var(--color-jev-soft)"
                strokeWidth="1.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              />
              <motion.rect x="190" y={y} width="112" height="30" rx="8" fill="var(--color-surface-3)" stroke="var(--color-line-2)" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} />
              <text x="246" y={y + 19} textAnchor="middle" fontSize="10" fill="var(--color-ink-2)">
                {q}
              </text>
              <motion.circle cx="325" cy={y + 15} r="9" fill="var(--color-jev)" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.85, type: "spring" }} />
              <motion.text x="325" y={y + 19} textAnchor="middle" fontSize="10" fill="white" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.95 }}>
                ✓
              </motion.text>
            </g>
          );
        })}
      </svg>
      <p className="text-xs text-ink-3">
        This is the same idea as prefix caching in LLM servers: the expensive shared prefix is paid for once and every question reuses it.
      </p>
    </Card>
  );
}
