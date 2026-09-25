"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Card, Reveal, Section, cn } from "@/components/ui";
import { COMPARE_URL } from "@/lib/links";
import { SpeedRace } from "./SpeedRace";
import { CostCalculator } from "./CostCalculator";
import { NoHallucination } from "./NoHallucination";

const ROWS: [string, string, string, string][] = [
  ["Output", "Typed values: choice, score, yes/no", "Free-form text, token by token", "Fixed labels it was trained on"],
  ["Latency", "70–500 ms", "3 s – minutes", "~50–100 ms on CPU (local)"],
  ["Cost", "$0.042 / 1M input, output free", "$0.25–$10+ / 1M output", "Your own server"],
  ["Training needed", "None: describe options in English", "None (prompting)", "Labelled data + fine-tuning"],
  ["New label tomorrow?", "Add it to the request", "Edit the prompt", "Re-label & re-train"],
  ["Invalid output possible?", "No, answers come from your options", "Yes, format drift", "No"],
  ["Calibrated confidence", "Yes, trained for it (RLCD)", "Rarely, often overconfident", "Softmax, often overconfident"],
  ["Explains its answer", "No", "Yes", "No"],
  ["Writes text / code / plans", "No", "Yes", "No"],
  ["World knowledge", "Broad", "Broad", "Narrow"],
  ["Input", "Text only (32K ctx)", "Text, images, audio…", "Text (512 tokens)"],
];

const TASKS: { task: string; pick: "JEV" | "LLM" | "Both"; why: string }[] = [
  { task: "Route 10k support emails a day", pick: "JEV", why: "High-volume choice question. Use confidence to send hard cases to a human." },
  { task: "Draft replies to those emails", pick: "LLM", why: "Needs generated text, which JEV can't do." },
  { task: "Customer-support agent with 12 tools", pick: "Both", why: "The LLM plans and writes. JEV picks the tool, checks safety, and decides continue/stop at each step." },
  { task: "Moderate live chat in a stream", pick: "JEV", why: "Real-time yes/no on every message. LLM latency would lag the chat." },
  { task: "Summarise a 40-page contract", pick: "LLM", why: "Open-ended reading and writing." },
  { task: "Agentic RAG: retrieve, search the web, or answer directly?", pick: "JEV", why: "A small routing decision in front of the heavy LLM call." },
  { task: "Decide a bank loan with an audit trail", pick: "LLM", why: "Regulated decisions need explanations, and JEV gives none. Keep a human in the loop." },
  { task: "Compact an agent's context window", pick: "Both", why: "JEV scores each item keep/drop quickly. An LLM can summarise what's kept." },
];

export function VsLlm() {
  const [task, setTask] = useState(0);
  const t = TASKS[task];
  return (
    <Section
      id="vs-llm"
      eyebrow="05 · JEV vs LLM"
      title="The same decision, faster and cheaper"
      lead="An LLM with structured output can also pick one of four options. JEV's claim isn't that it's smarter. It's that it makes the same kind of System-1 decision one to two orders of magnitude faster and cheaper, with typed output and honest confidence."
    >
      <div className="space-y-6">
        <Reveal>
          <SpeedRace />
        </Reveal>
        <Reveal>
          <CostCalculator />
        </Reveal>
        <Reveal>
          <NoHallucination />
        </Reveal>

        <Reveal>
          <Card className="overflow-hidden p-0 sm:p-0">
            <div className="p-5 sm:p-6">
              <h3 className="text-lg font-semibold">Side by side: JEV, LLM and a fine-tuned BERT</h3>
              <p className="mt-1 text-sm text-ink-2">
                BERT is included because it&apos;s what you&apos;d have used for classification before (and it&apos;s what the{" "}
                <a href={COMPARE_URL} className="text-jev-soft underline-offset-2 hover:underline">
                  lab
                </a>{" "}
                compares against).
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-y border-line bg-surface-2 text-left text-xs">
                    <th className="px-4 py-2.5 font-medium text-ink-3" />
                    <th className="px-4 py-2.5 font-medium text-jev-soft">JEV</th>
                    <th className="px-4 py-2.5 font-medium text-llm-soft">LLM</th>
                    <th className="px-4 py-2.5 font-medium text-ink-2">Fine-tuned BERT</th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map(([k, a, b, c]) => (
                    <tr key={k} className="border-b border-line/70 last:border-0 hover:bg-surface-2/50">
                      <td className="px-4 py-2.5 text-ink-3">{k}</td>
                      <td className="px-4 py-2.5">{a}</td>
                      <td className="px-4 py-2.5 text-ink-2">{b}</td>
                      <td className="px-4 py-2.5 text-ink-2">{c}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Reveal>

        <Reveal>
          <Card>
            <h3 className="text-lg font-semibold">Which one should I use?</h3>
            <p className="mt-1 text-sm text-ink-2">
              The practical rule: <b className="text-ink">LLMs do the heavy lifting, and decision models handle the many small decisions
              around them.</b> Pick a task:
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr]">
              <div className="flex flex-col gap-1.5">
                {TASKS.map((x, i) => (
                  <button
                    key={x.task}
                    onClick={() => setTask(i)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      task === i ? "border-jev/50 bg-jev/10 text-ink" : "border-line bg-surface-2 text-ink-2 hover:text-ink",
                    )}
                  >
                    {x.task}
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={task}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex flex-col justify-center rounded-xl border border-line bg-surface-2 p-6"
                >
                  <p className="text-xs uppercase tracking-wider text-ink-3">Use</p>
                  <p
                    className={cn(
                      "mt-1 text-5xl font-semibold",
                      t.pick === "JEV" ? "text-jev-soft" : t.pick === "LLM" ? "text-llm-soft" : "text-gradient",
                    )}
                  >
                    {t.pick === "Both" ? "JEV + LLM" : t.pick}
                  </p>
                  <p className="mt-3 text-ink-2">{t.why}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </Card>
        </Reveal>
      </div>
    </Section>
  );
}
