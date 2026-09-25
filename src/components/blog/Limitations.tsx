"use client";

import { Card, Pill, Reveal, Section } from "@/components/ui";

const LIMITS = [
  ["📏", "No independent benchmarks (yet)", "“40–200× faster, 20–100× cheaper” and “193.6× / 444.6×” are TypeSafe's own numbers from its own evals. Independent tests (JevBench, Archer Hume) are only starting, and on JevBench an open ~4B model already scores slightly higher.", "critical"],
  ["🧠", "Not very intelligent", "It's System 1 by design. It struggles with arithmetic, date comparison and multi-step reasoning. It is fast, not deep.", "critical"],
  ["🔍", "No explanations", "You get an answer and a confidence, but no reasoning. That makes it hard to justify in regulated settings such as banking or medicine.", "warn"],
  ["📝", "Text only, 32K context", "No images, audio or video yet. People work around this by serialising game screens and web pages to text.", "warn"],
  ["🌐", "No web search", "Answers come from its parametric knowledge, so anything after the training cutoff is invisible to it.", "warn"],
  ["🔒", "Closed", "No paper, weights, dataset or methodology. That's unusual even among closed labs, and open-source clones are already competing.", "neutral"],
  ["🧨", "Adversarial text", "The state is untrusted input. Text injected into it can sway decisions, so pair JEV with deterministic checks for safety-critical paths.", "critical"],
  ["🎯", "Bounded answers only", "You must know the possible answers in advance (up to 255 per choice). Open-ended questions are out of scope.", "neutral"],
] as const;

export function Limitations() {
  return (
    <Section
      id="limits"
      eyebrow="11 · The honest part"
      title="Limitations and open questions"
      lead="A System-1 model trades depth for speed. That trade-off is the whole point, and it's also the main constraint. Use JEV where a mistake is cheap or can be caught by a confidence threshold."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {LIMITS.map(([icon, t, d, tone], i) => (
          <Reveal key={t} delay={i * 0.03}>
            <Card className="h-full p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{icon}</span>
                <Pill tone={tone}>{tone === "critical" ? "major" : tone === "warn" ? "today" : "note"}</Pill>
              </div>
              <p className="mt-3 font-medium">{t}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-2">{d}</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
