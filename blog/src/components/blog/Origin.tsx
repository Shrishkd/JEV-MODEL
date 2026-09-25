"use client";

import { motion } from "motion/react";
import { Card, Reveal, Section } from "@/components/ui";

const TIMELINE = [
  { when: "2022", what: "InstructGPT & RLHF", detail: "Diogo Almeida is a key researcher on the OpenAI team behind InstructGPT and RLHF, the alignment work that made ChatGPT possible." },
  { when: "2024", what: "Leaves OpenAI, founds TypeSafe AI", detail: "The company works in stealth mode for about two years. Nobody knows what it's building." },
  { when: "15 Sept 2026", what: "JEV launches", detail: "TypeSafe's first model, and the first of a new class it calls System One models. Access starts as an early-access waitlist." },
  { when: "16 Sept 2026", what: "Vercel AI Gateway support", detail: "JEV becomes available as typesafe-ai/jev through Vercel's AI SDK (experimental_evaluate) and a TypeSafe-compatible HTTP API." },
  { when: "Sept 2026", what: "Ecosystem arrives within days", detail: "Pydantic AI, LangSmith tracing, Cloudflare and AI/ML API add support. More than 70 community demos appear, along with the first open clones and JevBench." },
];

export function Origin() {
  return (
    <Section
      id="origin"
      eyebrow="03 · Who & why"
      title="Built by one of the people who built ChatGPT"
      lead="JEV comes from TypeSafe AI, founded by Diogo Almeida, a former OpenAI researcher who worked on the techniques behind ChatGPT. His argument is that the industry made models brilliant at talking to humans but never made them good at talking to software."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <Reveal>
          <Card className="relative h-full overflow-hidden">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-jev/20 blur-3xl" />
            <p className="text-5xl leading-none text-jev/60">&ldquo;</p>
            <blockquote className="-mt-3 text-2xl font-medium leading-snug text-balance">
              Models have been superhuman at chat for years. <span className="text-jev-soft">So where is all the automation?</span>
            </blockquote>
            <p className="mt-6 text-sm text-ink-2">Almeida&apos;s answer, from the TypeSafe site:</p>
            <blockquote className="mt-2 border-l-2 border-jev pl-4 text-lg">
              &ldquo;Software needs System 1 thinking, but we keep building System 2.&rdquo;
            </blockquote>
            <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
              {[
                ["The problem", "Automation demos fail in production. LLM calls are slow, costly and return messy text."],
                ["The diagnosis", "LLMs are optimised to chat with humans, not to plug into software as a component."],
                ["The fix", "A model whose only output is a typed decision that code can branch on."],
              ].map(([h, d]) => (
                <div key={h} className="rounded-xl border border-line bg-surface-2 p-3">
                  <p className="font-medium text-ink">{h}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-2">{d}</p>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.08}>
          <ol className="relative space-y-5 border-l border-line-2 pl-6">
            {TIMELINE.map((t, i) => (
              <motion.li
                key={t.what}
                initial={{ opacity: 0, x: 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="relative"
              >
                <span className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-bg bg-jev ring-2 ring-jev/30" />
                <p className="font-mono text-xs text-jev-soft">{t.when}</p>
                <p className="mt-0.5 font-medium">{t.what}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-2">{t.detail}</p>
              </motion.li>
            ))}
          </ol>
        </Reveal>
      </div>
    </Section>
  );
}
