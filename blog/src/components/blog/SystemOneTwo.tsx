"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Card, Pill, Reveal, Section, cn } from "@/components/ui";

const TASKS: { task: string; answer: 1 | 2; why: string }[] = [
  { task: "Send this email to billing, shipping or support?", answer: 1, why: "A quick pick from a fixed set of queues. It needs no reasoning chain." },
  { task: "Write a cover letter for this job posting", answer: 2, why: "The output is free-form text, and JEV cannot generate text." },
  { task: "Which of my agent's 10 tools fits this step?", answer: 1, why: "Tool selection is a choice question. The LLM can still fill complex arguments." },
  { task: "Plan a 3-week migration from MySQL to Postgres", answer: 2, why: "Multi-step planning is deliberate System-2 work." },
  { task: "Is this YouTube comment abusive?", answer: 1, why: "A yes/no decision on thousands of comments, made in real time." },
  { task: "Is this user prompt a jailbreak attempt?", answer: 1, why: "A guardrail that runs before any LLM sees the prompt." },
  { task: "Explain why the quarterly revenue dropped", answer: 2, why: "Needs reasoning and an explanation, and JEV gives no explanations." },
  { task: "Game agent: jump, duck or run?", answer: 1, why: "A real-time decision. An LLM's multi-second thinking loses the game." },
];

export function SystemOneTwo() {
  const [picks, setPicks] = useState<Record<number, 1 | 2>>({});
  const score = Object.entries(picks).filter(([i, p]) => TASKS[+i].answer === p).length;
  const done = Object.keys(picks).length;

  return (
    <Section
      id="system1"
      eyebrow="02 · The core idea"
      title={
        <>
          Software needs <span className="text-jev-soft">System 1</span>. We keep building{" "}
          <span className="text-llm-soft">System 2</span>.
        </>
      }
      lead={
        <>
          In <i>Thinking, Fast and Slow</i>, Daniel Kahneman describes two modes of thought. <b className="text-ink">System 1</b> is fast
          and intuitive: you swerve when a car cuts in front of your bike. <b className="text-ink">System 2</b> is slow and deliberate:
          you plan where your career should be in five years. Today&apos;s LLMs are System-2 machines, and much of software only needs
          System 1.
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Reveal>
          <Card className="relative h-full overflow-hidden border-jev/30">
            <div className="absolute right-4 top-4">
              <Pill tone="jev">~0.1–0.5 s</Pill>
            </div>
            <h3 className="text-xl font-semibold text-jev-soft">System 1 · fast</h3>
            <p className="mt-1 text-sm text-ink-2">Intuitive, automatic, cheap. One shot, no deliberation.</p>
            <FastViz />
            <ul className="mt-4 space-y-1.5 text-sm text-ink-2">
              <li>🏍️ Swerve away from the car</li>
              <li>📨 Route an email to the right team</li>
              <li>🛡️ Flag an unsafe comment</li>
              <li>🤖 Pick the next tool for an agent</li>
            </ul>
            <p className="mt-4 text-sm">
              Best tool: <b className="text-jev-soft">decision models like JEV</b>
            </p>
          </Card>
        </Reveal>
        <Reveal delay={0.08}>
          <Card className="relative h-full overflow-hidden border-llm/30">
            <div className="absolute right-4 top-4">
              <Pill tone="llm">~3–300 s</Pill>
            </div>
            <h3 className="text-xl font-semibold text-llm-soft">System 2 · slow</h3>
            <p className="mt-1 text-sm text-ink-2">Deliberate, step-by-step, expensive. Think, plan, then answer.</p>
            <SlowViz />
            <ul className="mt-4 space-y-1.5 text-sm text-ink-2">
              <li>🧭 Plan your next five years</li>
              <li>✍️ Write an essay or code</li>
              <li>🔬 Debug a multi-step problem</li>
              <li>🗺️ Plan an agent&apos;s whole task</li>
            </ul>
            <p className="mt-4 text-sm">
              Best tool: <b className="text-llm-soft">reasoning LLMs</b>
            </p>
          </Card>
        </Reveal>
      </div>

      <Reveal>
        <Card className="mt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-lg font-semibold">Quick game: System 1 or System 2?</h3>
            <span className="font-mono text-sm text-ink-2">
              {score}/{done} correct {done === TASKS.length && (score >= 7 ? "· 🔥 decision engineer material" : "· scroll on, it'll click")}
            </span>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {TASKS.map((t, i) => {
              const pick = picks[i];
              const right = pick === t.answer;
              return (
                <div key={t.task} className={cn("rounded-xl border p-3 transition-colors", pick ? (right ? "border-good/50 bg-good/5" : "border-critical/50 bg-critical/5") : "border-line bg-surface-2")}>
                  <p className="text-sm">{t.task}</p>
                  <div className="mt-2 flex items-center gap-2">
                    {([1, 2] as const).map((s) => (
                      <button
                        key={s}
                        disabled={!!pick}
                        onClick={() => setPicks((p) => ({ ...p, [i]: s }))}
                        className={cn(
                          "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-default",
                          s === 1 ? "border-jev/40 text-jev-soft hover:bg-jev/10" : "border-llm/40 text-llm-soft hover:bg-llm/10",
                          pick === s && (s === 1 ? "bg-jev/15" : "bg-llm/15"),
                        )}
                      >
                        System {s}
                      </button>
                    ))}
                    <AnimatePresence>
                      {pick && (
                        <motion.span initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} className="text-xs text-ink-2">
                          {right ? "✓" : "✗"} {t.why}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </Reveal>
    </Section>
  );
}

function FastViz() {
  return (
    <svg viewBox="0 0 300 70" className="mt-5 w-full" aria-hidden>
      <rect x="4" y="25" width="60" height="22" rx="6" fill="none" stroke="var(--color-line-2)" />
      <text x="34" y="40" textAnchor="middle" fontSize="10" fill="var(--color-ink-2)">input</text>
      <motion.path
        d="M66 36 L232 36"
        stroke="var(--color-jev)"
        strokeWidth="2"
        strokeDasharray="6 4"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        transition={{ duration: 0.35, repeat: Infinity, repeatDelay: 1.6 }}
      />
      <motion.text x="150" y="28" textAnchor="middle" fontSize="16" initial={{ opacity: 0.3 }} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }}>
        ⚡
      </motion.text>
      <rect x="236" y="25" width="60" height="22" rx="6" fill="var(--color-jev)" fillOpacity="0.15" stroke="var(--color-jev)" />
      <text x="266" y="40" textAnchor="middle" fontSize="10" fill="var(--color-jev-soft)">decision</text>
    </svg>
  );
}

function SlowViz() {
  const steps = ["read", "reason", "plan", "draft", "answer"];
  return (
    <svg viewBox="0 0 300 70" className="mt-5 w-full" aria-hidden>
      {steps.map((s, i) => (
        <g key={s}>
          <motion.rect
            x={4 + i * 60}
            y="25"
            width="50"
            height="22"
            rx="6"
            fill="var(--color-llm)"
            stroke="var(--color-llm)"
            initial={{ fillOpacity: 0.02 }}
            animate={{ fillOpacity: [0.02, 0.25, 0.02] }}
            transition={{ duration: 1, delay: i * 0.7, repeat: Infinity, repeatDelay: 2.5 }}
          />
          <text x={29 + i * 60} y="40" textAnchor="middle" fontSize="9.5" fill="var(--color-ink-2)">
            {s}
          </text>
          {i < steps.length - 1 && <path d={`M${55 + i * 60} 36 L${63 + i * 60} 36`} stroke="var(--color-line-2)" />}
        </g>
      ))}
    </svg>
  );
}
