"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Card, CodeBlock, Reveal, Section, Tabs, cn } from "@/components/ui";

const BEFORE = `// AI as a *feature*: a slow, costly, fragile side-quest
const res = await llm.chat({
  messages: [{ role: "user", content: \`Is this customer angry? Answer yes or no.\\n\\n\${email}\` }],
  response_format: { type: "json_object" },
});                                   // 3–8 s, $$$ per call
let angry = false;
try { angry = JSON.parse(res.text).angry === "yes"; }   // hope the format holds
catch { angry = /angry|yes/i.test(res.text); }         // regex fallback 🙃`;

const AFTER = `// AI as a *primitive*: just another if-statement
const { answers } = await jev(email, {
  angry: { type: "noul", instructions: "Is this customer angry?" },
});                                   // ~200 ms, fractions of a paisa

if (answers.angry.noul > 0.9) escalateToSeniorAgent(email);`;

const AREAS = [
  ["🤖", "AI agents", "Tool selection, “is this step safe?”, continue/retry/stop. These are the small decisions in every agent loop."],
  ["🏢", "Business ops", "Support triage, refund approvals, invoice fraud checks, lead scoring."],
  ["🛡️", "Trust & safety", "Real-time comment moderation, spam and fraud flags, jailbreak and prompt-injection screens before the LLM."],
  ["🗂️", "Unstructured data", "Logs, catalogues, tickets and call transcripts sorted into categories at scale."],
  ["⚡", "Real-time systems", "Game agents, live UI (ad blockers, feed filters), trading signals."],
  ["🧠", "Context engineering", "Keep/drop scoring for context compaction, and routing queries to the right model or retriever."],
];

const PREDICTIONS = [
  ["Everyone copies it", "Open clones exist already, Laya predates it, and frontier labs will likely ship their own decision models."],
  ["It disappears into the stack", "Cloud platforms and frameworks will call decision models internally without you noticing."],
  ["LLM + decision model, together", "A big model plans, and cheap decision models run every step in between. This does not replace LLMs."],
  ["Tooling grows around it", "Tracing, evals and threshold tuning. LangSmith already traces JEV calls."],
  ["A new role: decision engineer", "Someone who designs the questions, options and thresholds, and decides where System-1 AI goes."],
  ["Multimodal & web search", "Text-only today. Images, audio and fresh knowledge are the obvious next steps."],
  ["Decisions on every interaction", "When a decision costs about ₹0.0004, software can afford AI on every click and keystroke."],
];

export function Impact() {
  const [v, setV] = useState<"before" | "after">("after");
  return (
    <Section
      id="impact"
      eyebrow="10 · Why it matters"
      title={
        <>
          AI moves from a <span className="text-llm-soft">feature</span> to a <span className="text-jev-soft">primitive</span>
        </>
      }
      lead="When a decision costs almost nothing and returns in milliseconds, calling AI stops being a product announcement and becomes plumbing. It's just another branch in your code."
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Reveal>
          <div>
            <Tabs
              value={v}
              onChange={setV}
              tabs={[
                { id: "before", label: "Before: LLM as a feature" },
                { id: "after", label: "After: JEV as a primitive" },
              ]}
            />
            <CodeBlock className="mt-3" code={v === "before" ? BEFORE : AFTER} lang="typescript" />
          </div>
        </Reveal>
        <Reveal delay={0.06}>
          <AgentLoop />
        </Reveal>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {AREAS.map(([i, t, d], k) => (
          <Reveal key={t} delay={k * 0.04}>
            <Card className="h-full p-4 sm:p-5">
              <p className="text-2xl">{i}</p>
              <p className="mt-2 font-medium">{t}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-2">{d}</p>
            </Card>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <Card className="mt-8">
          <h3 className="text-lg font-semibold">Seven predictions from the video (next 6–24 months)</h3>
          <ol className="mt-4 grid gap-3 md:grid-cols-2">
            {PREDICTIONS.map(([t, d], i) => (
              <li key={t} className="flex gap-3 rounded-xl border border-line bg-surface-2 p-3">
                <span className="font-mono text-sm text-jev-soft">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className="text-sm font-medium">{t}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-2">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </Reveal>

      <Reveal>
        <Card className="mt-6">
          <h3 className="text-lg font-semibold">From the live Q&amp;A</h3>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium">&ldquo;Can we use it for agentic query routing instead of an LLM?&rdquo;</p>
              <p className="mt-1 text-sm text-ink-2">
                Yes. That&apos;s a tailor-made use case. Retrieve from the vector store, search the web, or answer from internal
                knowledge? That&apos;s a small decision, so there&apos;s no need to spend an LLM call on it.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">&ldquo;If an agent needs planning, where does JEV fit?&rdquo;</p>
              <p className="mt-1 text-sm text-ink-2">
                Planning and tool <i>arguments</i> stay with the LLM. Tool <i>selection</i>, &ldquo;is this step safe?&rdquo; and
                continue/stop checks can go to JEV. The heavy lifting stays with the LLM.
              </p>
            </div>
          </div>
        </Card>
      </Reveal>
    </Section>
  );
}

const LOOP = [
  { who: "llm", text: "Plan: find cheapest ZRH→LHR flight" },
  { who: "jev", text: "Which tool? → browser (0.93)" },
  { who: "jev", text: "Safe to proceed? → yes (0.98)" },
  { who: "llm", text: "Fill search form arguments" },
  { who: "jev", text: "Goal reached? → no (0.12) · continue" },
  { who: "jev", text: "Next element? → sort_by_price (0.88)" },
  { who: "jev", text: "Goal reached? → yes (0.95) · stop" },
  { who: "llm", text: "Write summary for the user" },
] as const;

function AgentLoop() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % (LOOP.length + 2)), 900);
    return () => clearInterval(id);
  }, []);
  return (
    <Card className="h-full">
      <h3 className="font-semibold">An agent loop, split by System</h3>
      <p className="mt-1 text-xs text-ink-2">
        <span className="text-llm-soft">■ LLM</span> for heavy lifting · <span className="text-jev-soft">■ JEV</span> for the many small
        decisions
      </p>
      <ol className="mt-3 space-y-1.5">
        {LOOP.map((s, k) => (
          <motion.li
            key={k}
            animate={{ opacity: k < i ? 1 : 0.25, x: k < i ? 0 : 6 }}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 font-mono text-xs",
              s.who === "llm" ? "border-llm/30 bg-llm/5 text-llm-soft" : "border-jev/30 bg-jev/5 text-jev-soft",
            )}
          >
            <span className="w-8 shrink-0 text-[10px] uppercase opacity-70">{s.who}</span>
            {s.text}
          </motion.li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-ink-3">5 of 8 steps are System-1 decisions, and each would otherwise cost a multi-second LLM call.</p>
    </Card>
  );
}
