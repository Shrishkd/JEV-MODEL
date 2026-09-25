"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Card, Reveal, Section, Stat } from "@/components/ui";
import { useCurrency } from "@/lib/currency";

// TypeSafe's own 4-workflow evaluation, as reported by DataCamp (agreement with reference answers).
const AGREEMENT = [
  { model: "GPT-5.6 Sol", v: 74.1 },
  { model: "Claude Opus 5", v: 73.1 },
  { model: "GPT-5.6 Terra", v: 67.9 },
  { model: "JEV", v: 67.8, jev: true },
];

const PLAYERS = [
  ["Laya", "The earlier competitor. Its creator built a non-autoregressive decision model trained with RL a year before JEV and published a paper and dataset. JEV got more attention largely because of its founder's profile."],
  ["JevBench v1.4.2", "Benchmark Heaven's leaderboard: intelligence, calibration, speed and cost weighted equally over 534 public + 308 sealed decisions. At the time of writing an open ~4B model (decider-4b v2, 64.1) edges Jev 1.13.0 (63.3), with JevK5 (62.0) close behind."],
  ["Open clones", "Within a week, open models built the same way appeared: a pre-trained backbone (e.g. ~4B Qwen) with a new answer head, trained on synthetic data."],
  ["Integrations", "Vercel AI Gateway & AI SDK, Pydantic AI, LangSmith tracing, Cloudflare Workers AI, AI/ML API, and official Python & JS SDKs."],
];

export function Ecosystem() {
  const { fmt } = useCurrency();
  const [hover, setHover] = useState<number | null>(null);
  return (
    <Section
      id="future"
      eyebrow="12 · Evidence & ecosystem"
      title="How good is it, really?"
      lead="The best numbers so far are TypeSafe's own four-workflow evaluation. On those workflows, JEV roughly matches a mid-tier frontier model's agreement with reference answers at a tiny fraction of the cost and latency. It trails the top models. That supports the positioning: not smarter, but fast and cheap enough to use everywhere."
    >
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Reveal>
          <Card className="h-full">
            <h3 className="font-semibold">Agreement with reference answers (%)</h3>
            <p className="mt-1 text-xs text-ink-3">TypeSafe 4-workflow eval · higher is better · single axis from 0</p>
            <div className="mt-5 space-y-3">
              {AGREEMENT.map((a, i) => (
                <div key={a.model} className="grid grid-cols-[7.5rem_1fr_3rem] items-center gap-3 text-sm" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                  <span className={a.jev ? "font-medium text-jev-soft" : "text-ink-2"}>{a.model}</span>
                  <div className="relative h-5 rounded-r bg-surface-2">
                    <motion.div
                      className={a.jev ? "h-full rounded-r bg-jev" : "h-full rounded-r bg-ink-3/60"}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${a.v}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: i * 0.08 }}
                      style={{ outline: hover === i ? "2px solid var(--color-surface)" : undefined }}
                    />
                  </div>
                  <span className="text-right font-mono tabular-nums">{a.v}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Stat label="Latency per case" value="0.4 s" sub="vs 10–38 s for the LLMs" tone="jev" />
              <Stat label="Cost per case" value={fmt(0.0004, { digits: 4 })} sub={`vs ${fmt(0.0304, { digits: 3 })}–${fmt(0.1761, { digits: 3 })}`} tone="jev" />
            </div>
            <p className="mt-3 text-xs text-ink-3">These are vendor-run evals. Treat them as a claim to verify, which is exactly what the BERT vs JEV lab lets you do.</p>
          </Card>
        </Reveal>
        <Reveal delay={0.06}>
          <div className="space-y-3">
            {PLAYERS.map(([t, d]) => (
              <Card key={t} className="p-4 sm:p-5">
                <p className="font-medium">{t}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-2">{d}</p>
              </Card>
            ))}
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
