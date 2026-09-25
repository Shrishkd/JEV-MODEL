"use client";

import { useState } from "react";
import { Card, Reveal, Section, cn } from "@/components/ui";

const QS = [
  {
    q: "What does JEV return?",
    opts: ["Generated text, token by token", "Typed values (choice / score / yes-no) with probabilities", "Embeddings for a vector store", "A fine-tuned copy of itself"],
    a: 1,
    why: "JEV is a decision model. It never generates text.",
  },
  {
    q: "Why can't JEV return an invalid label?",
    opts: ["It was trained longer", "It uses regex on its own output", "It only scores the options you supply", "It asks an LLM to double-check"],
    a: 2,
    why: "The answer head produces a probability for each supplied option, and nothing else can come out.",
  },
  {
    q: "JEV says 0.9 confidence on 1,000 tickets. If it's well calibrated, about how many are wrong?",
    opts: ["~0", "~100", "~500", "Can't know"],
    a: 1,
    why: "Calibrated means that when it says 90%, it's right about 90% of the time, so roughly 100 are wrong.",
  },
  {
    q: "Which task should stay with an LLM?",
    opts: ["Pick one of 10 tools", "Flag spam comments", "Write a reply email", "Route a ticket"],
    a: 2,
    why: "Anything that needs generated text is System-2 or LLM territory.",
  },
  {
    q: "The most likely reason JEV is so fast:",
    opts: ["It runs on quantum chips", "It skips the decode loop: one pass and an answer head", "It caches every possible answer", "It uses fewer questions"],
    a: 1,
    why: "Prefill runs once, and a single softmax over your options replaces token-by-token decoding.",
  },
  {
    q: "What does RLCD optimise for?",
    opts: ["Human preference", "Honest probabilities (calibration)", "Longer answers", "Lower latency"],
    a: 1,
    why: "Reinforcement Learning for Calibrated Decisions rewards confidence that matches reality.",
  },
];

export function Quiz() {
  const [ans, setAns] = useState<Record<number, number>>({});
  const score = QS.filter((q, i) => ans[i] === q.a).length;
  const done = Object.keys(ans).length === QS.length;
  return (
    <Section id="quiz" eyebrow="14 · Check yourself" title="Six-question quiz" className="pt-4">
      <Reveal>
        <div className="grid gap-4 md:grid-cols-2">
          {QS.map((q, i) => (
            <Card key={q.q} className="p-4 sm:p-5">
              <p className="font-medium">
                <span className="mr-2 font-mono text-jev-soft">{i + 1}.</span>
                {q.q}
              </p>
              <div className="mt-3 grid gap-1.5">
                {q.opts.map((o, j) => {
                  const picked = ans[i] === j;
                  const show = ans[i] !== undefined;
                  return (
                    <button
                      key={o}
                      disabled={show}
                      onClick={() => setAns((a) => ({ ...a, [i]: j }))}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:cursor-default",
                        show && j === q.a && "border-good/60 bg-good/10",
                        show && picked && j !== q.a && "border-critical/60 bg-critical/10",
                        !show && "border-line bg-surface-2 hover:border-jev/50",
                        show && !picked && j !== q.a && "border-line bg-surface-2 opacity-50",
                      )}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
              {ans[i] !== undefined && <p className="mt-2 text-xs text-ink-2">{q.why}</p>}
            </Card>
          ))}
        </div>
        {done && (
          <p className="mt-6 text-center text-lg">
            You scored <b className="text-jev-soft">{score}/6</b>. {score === 6 ? "Perfect! 🎯" : score >= 4 ? "Solid, just review the misses." : "Scroll back up and try again."}{" "}
            <button className="ml-2 text-sm text-ink-3 underline" onClick={() => setAns({})}>
              reset
            </button>
          </p>
        )}
      </Reveal>
    </Section>
  );
}
