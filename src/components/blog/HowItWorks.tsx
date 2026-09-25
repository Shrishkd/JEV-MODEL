"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Button, Card, CodeBlock, Reveal, Section, SimBadge, Tabs, cn } from "@/components/ui";

const TYPES = [
  {
    id: "choice",
    name: "Choice",
    desc: "Pick one option from a named set. You get the choice, a confidence and a probability for every option. Up to 255 options.",
    ex: "department → billing · shipping · technical",
    out: '{ "choice": "shipping", "confidence": 0.86, "probabilities": {…} }',
  },
  {
    id: "score",
    name: "Score",
    desc: "Rate along an ordered scale (rubric). You get an interpolated score plus the probability of each rung.",
    ex: "frustration → calm · annoyed · angry · furious",
    out: '{ "score": 2.31, "confidence": 0.71, "probabilities": {"0":0.01, …} }',
  },
  {
    id: "noul",
    name: "Noul (yes/no)",
    desc: "A boolean returned as a probability from 0 to 1. You set the threshold, for example 0.9 for fewer false positives.",
    ex: "refund_requested → true / false",
    out: '{ "noul": 0.97 }',
  },
];

const QUESTIONS = [
  { name: "queue", type: "choice", q: "Which team?", a: "shipping", p: 0.71 },
  { name: "urgent", type: "noul", q: "Is it urgent?", a: "yes", p: 0.82 },
  { name: "refund", type: "noul", q: "Refund requested?", a: "yes", p: 0.97 },
  { name: "sentiment", type: "score", q: "Customer mood 1–5?", a: "2 · upset", p: 0.74 },
  { name: "language", type: "choice", q: "Language?", a: "english", p: 0.99 },
];

const CODE = {
  curl: `curl https://api.typesafe.ai/v1/systemone \\
  -H "Authorization: Bearer $TYPESAFE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "jev-latest",
    "state": "My package arrived damaged and I want a refund.",
    "questions": {
      "queue":  { "type": "choice", "instructions": "Which team should handle this?",
                  "criteria": { "billing": "payments, refunds", "shipping": "delivery problems",
                                "technical": "app bugs", "general": "anything else" } },
      "urgent": { "type": "noul", "instructions": "Is this urgent?" },
      "mood":   { "type": "score", "instructions": "How upset is the customer?",
                  "criteria": ["calm", "annoyed", "upset", "furious"] }
    }
  }'`,
  python: `# pip install typesafe-sdk      (reads TYPESAFE_API_KEY)
from typesafe_sdk import TypeSafeClient, Choice, Score, Noul

client = TypeSafeClient()          # defaults to jev-latest

res = client.system_one(
    "My package arrived damaged and I want a refund.",
    {
        "queue":  Choice(instructions="Which team should handle this?",
                         criteria={"billing": "payments", "shipping": "delivery",
                                   "technical": "bugs", "general": "other"}),
        "urgent": Noul(instructions="Is this urgent?"),
        "mood":   Score(instructions="How upset is the customer?",
                        criteria=["calm", "annoyed", "upset", "furious"]),
    },
)

q = res.choices["queue"]
if q.confidence > 0.9:
    forward_to(q.choice)             # AI as an if/else primitive`,
  aisdk: `// Vercel AI SDK 7 — routes through AI Gateway (AI_GATEWAY_API_KEY)
import { experimental_evaluate as evaluate } from "ai";

const { answers } = await evaluate({
  model: "typesafe-ai/jev",
  state: "My package arrived damaged and I want a refund.",
  questions: {
    queue:  { type: "choice", instructions: "Which team should handle this?",
              criteria: { billing: "payments", shipping: "delivery",
                          technical: "bugs", general: "other" } },
    urgent: { type: "boolean", instructions: "Is this urgent?" },
  },
});
// answers.queue  → { type: "choice", choice: "shipping", probabilities: {...} }
// answers.urgent → { type: "boolean", probability: 0.82 }`,
  pydantic: `# pip install "pydantic-ai-slim[typesafe]"
from typing import Literal
from pydantic import BaseModel, Field
from pydantic_ai import Agent

class Ticket(BaseModel):
    """Triage a support ticket."""
    queue: Literal["billing", "shipping", "technical", "general"] = Field(
        description="Which team owns it?")
    urgent: bool = Field(description="Does this need a reply within the hour?")

agent = Agent("typesafe:jev-latest", output_type=Ticket)
print(agent.run_sync("My package arrived damaged and I want a refund.").output)`,
};

export function HowItWorks() {
  const [lang, setLang] = useState<keyof typeof CODE>("curl");
  const [run, setRun] = useState(0);

  return (
    <Section
      id="how"
      eyebrow="04 · How to use it"
      title="State in, typed answers out"
      lead={
        <>
          Every JEV call has the same shape. The <b className="text-ink">state</b> is anything text-like: a review, an email, a JSON
          record, a game screen serialised to text. The <b className="text-ink">questions</b> each have one of three types. There is
          no prompt engineering and no output parsing.
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        {TYPES.map((t, i) => (
          <Reveal key={t.id} delay={i * 0.06}>
            <Card className="h-full">
              <p className="font-mono text-xs text-jev-soft">type: &quot;{t.id}&quot;</p>
              <h3 className="mt-1 text-lg font-semibold">{t.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{t.desc}</p>
              <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 font-mono text-[11.5px] text-ink-2">{t.ex}</p>
              <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 font-mono text-[11.5px] text-jev-soft">{t.out}</p>
            </Card>
          </Reveal>
        ))}
      </div>

      {/* Parallel questions */}
      <Reveal>
        <Card className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold">Five questions, one call, answered in parallel</h3>
                <SimBadge />
              </div>
              <p className="mt-1 text-sm text-ink-2">
                The state is sent once and every question is answered at the same time. Adding questions barely changes latency or
                cost. In the video, five questions took ~7 s with an LLM and ~130 ms with JEV.
              </p>
            </div>
            <Button onClick={() => setRun((r) => r + 1)}>{run ? "Run again" : "Ask all 5"}</Button>
          </div>
          <div className="mt-6 grid items-center gap-4 lg:grid-cols-[1fr_auto_1.4fr]">
            <div className="rounded-xl border border-line bg-surface-2 p-4 font-mono text-[13px]">
              <p className="mb-1 text-[11px] uppercase tracking-wider text-ink-3">state (sent once)</p>
              &ldquo;My package arrived damaged and I want a refund. This is the second time!&rdquo;
            </div>
            <FanOut run={run} />
            <div className="space-y-2">
              {QUESTIONS.map((q, i) => (
                <div key={q.name} className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3 rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm">
                  <span className="font-mono text-xs text-ink-3">
                    {q.name}
                    <span className="block text-[10px] text-ink-3/70">{q.type}</span>
                  </span>
                  <span className="text-ink-2">{q.q}</span>
                  <AnimatePresence mode="wait">
                    {run > 0 ? (
                      <motion.span
                        key={`a${run}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.45 + i * 0.015 }}
                        className="rounded-md bg-jev/15 px-2 py-0.5 font-mono text-xs text-jev-soft"
                      >
                        {q.a} · {q.p.toFixed(2)}
                      </motion.span>
                    ) : (
                      <span className="font-mono text-xs text-ink-3">—</span>
                    )}
                  </AnimatePresence>
                </div>
              ))}
              {run > 0 && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="pt-1 text-right font-mono text-xs text-jev-soft">
                  all 5 answered in ~130 ms · billed for one state
                </motion.p>
              )}
            </div>
          </div>
        </Card>
      </Reveal>

      <Reveal>
        <div className="mt-8">
          <Tabs
            value={lang}
            onChange={setLang}
            tabs={[
              { id: "curl", label: "HTTP (TypeSafe)" },
              { id: "python", label: "Python SDK" },
              { id: "aisdk", label: "Vercel AI SDK" },
              { id: "pydantic", label: "Pydantic AI" },
            ]}
          />
          <CodeBlock className="mt-3" code={CODE[lang]} lang={lang === "curl" ? "bash" : lang === "aisdk" ? "typescript" : "python"} />
          <p className="mt-2 text-xs text-ink-3">
            Snippets follow the documented shapes from TypeSafe, Vercel and Pydantic. Note that Vercel&apos;s AI SDK calls the boolean type
            <code className="mx-1 font-mono">&quot;boolean&quot;</code>, while TypeSafe&apos;s native API calls it
            <code className="mx-1 font-mono">&quot;noul&quot;</code>.
          </p>
        </div>
      </Reveal>
    </Section>
  );
}

function FanOut({ run }: { run: number }) {
  return (
    <svg viewBox="0 0 90 200" className={cn("mx-auto hidden h-52 w-24 lg:block")} aria-hidden>
      {[20, 60, 100, 140, 180].map((y, i) => (
        <motion.path
          key={`${run}-${y}`}
          d={`M0 100 C45 100 45 ${y} 90 ${y}`}
          fill="none"
          stroke="var(--color-jev)"
          strokeWidth="1.6"
          initial={{ pathLength: 0, opacity: 0.4 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: i * 0.015 }}
        />
      ))}
    </svg>
  );
}
