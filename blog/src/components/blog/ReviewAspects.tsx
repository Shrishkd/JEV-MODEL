"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { Button, Card, CodeBlock, Reveal, Section, SimBadge, cn } from "@/components/ui";
import { ASPECTS, REVIEWS, type AspectKey } from "@/lib/data/reviews";

const QUESTIONS_CODE = `questions = {}
for aspect in ["camera", "battery", "display", "design",
               "performance", "build_quality", "value_for_money"]:
    # 1) Is the aspect discussed at all?
    questions[f"{aspect}_mentioned"] = Noul(
        instructions=f"Does the reviewer describe an opinion or experience about the {aspect}?")
    # 2) If so, how satisfied are they?
    questions[f"{aspect}_rating"] = Score(
        instructions=f"How satisfied is the reviewer with the {aspect}?",
        criteria=["very unhappy", "unhappy", "neutral", "happy", "very happy"])

# 14 questions, ONE call per review, all answered in parallel
res = client.system_one(review_text, questions)
if res.nouls["camera_mentioned"] > 0.5:          # confidence threshold from the demo
    camera_scores.append(res.scores["camera_rating"].score + 1)`;

export function ReviewAspects() {
  const [progress, setProgress] = useState(0); // reviews processed
  const [running, setRunning] = useState(false);
  const [selected, setSelected] = useState<AspectKey | null>(null);
  const [showCode, setShowCode] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const overall = REVIEWS.reduce((a, r) => a + r.rating, 0) / REVIEWS.length;
  const done = progress >= REVIEWS.length;

  const stats = useMemo(() => {
    const seen = REVIEWS.slice(0, progress);
    return ASPECTS.map((a) => {
      const scores = seen.map((r) => r.aspects[a.key]).filter((x): x is number => x !== undefined);
      return { ...a, n: scores.length, avg: scores.length ? scores.reduce((x, y) => x + y, 0) / scores.length : 0 };
    });
  }, [progress]);

  const run = () => {
    if (timer.current) clearInterval(timer.current);
    setSelected(null);
    setProgress(0);
    setRunning(true);
    timer.current = setInterval(() => {
      setProgress((p) => {
        if (p + 1 >= REVIEWS.length) {
          clearInterval(timer.current!);
          setRunning(false);
        }
        return p + 1;
      });
    }, 70);
  };

  const list = selected ? REVIEWS.filter((r) => r.aspects[selected] !== undefined) : REVIEWS;
  const terms = selected ? ASPECTS.find((a) => a.key === selected)!.terms : [];

  return (
    <Section
      id="demo-reviews"
      eyebrow="08 · The demo from the video"
      title="Flipkart-style aspect ratings, with no model training"
      lead={
        <>
          Flipkart shows separate ratings for camera, battery, display and so on. Its data-science team probably trained or fine-tuned a
          model (e.g. BERT) for that. With JEV you send each review with <b className="text-ink">14 questions</b> (7 aspects × &ldquo;is
          it mentioned?&rdquo; + &ldquo;how satisfied?&rdquo;) and aggregate the answers. The video built this in about 100 lines.
        </>
      }
    >
      <Reveal>
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-12 items-center justify-center rounded-xl border border-line-2 bg-gradient-to-b from-surface-3 to-surface-2 text-2xl">📱</div>
              <div>
                <p className="font-semibold">Aster M1 5G</p>
                <p className="text-sm text-ink-2">
                  <span className="rounded bg-good px-1.5 py-0.5 text-xs font-semibold text-white">{overall.toFixed(1)} ★</span>{" "}
                  {REVIEWS.length} reviews (hypothetical phone)
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SimBadge />
              <Button variant="outline" onClick={() => setShowCode((s) => !s)}>
                {showCode ? "Hide" : "Show"} the 14 questions
              </Button>
              <Button onClick={run} disabled={running}>
                {running ? `Analysing ${progress}/${REVIEWS.length}…` : done ? "Re-run" : "Analyse reviews"}
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {showCode && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <CodeBlock className="mt-4" code={QUESTIONS_CODE} lang="python · typesafe-sdk" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-ink-3">
            <span>
              reviews: <b className="text-ink">{progress}</b>/{REVIEWS.length}
            </span>
            <span>
              questions answered: <b className="text-ink">{progress * 14}</b>
            </span>
            <span>
              API calls: <b className="text-ink">{progress}</b>
            </span>
            <span>
              simulated time: <b className="text-jev-soft">{((progress * 190) / 1000 / 8).toFixed(2)} s</b> (8 concurrent)
            </span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-3">
            <div className="h-full bg-jev transition-all" style={{ width: `${(progress / REVIEWS.length) * 100}%` }} />
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <button
                key={s.key}
                disabled={!s.n}
                onClick={() => setSelected((x) => (x === s.key ? null : s.key))}
                className={cn(
                  "rounded-xl border p-3 text-left transition-colors disabled:cursor-default",
                  selected === s.key ? "border-jev bg-jev/10" : "border-line bg-surface-2 hover:border-line-2",
                )}
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-ink-2">{s.label}</span>
                  <span className="font-mono text-lg font-semibold tabular-nums">{s.n ? s.avg.toFixed(1) : "–"}</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-surface-3">
                  <motion.div className="h-full rounded-full bg-jev" animate={{ width: `${(s.avg / 5) * 100}%` }} />
                </div>
                <p className="mt-1.5 text-[11px] text-ink-3">{s.n ? `in ${s.n} reviews · click to filter` : "not analysed yet"}</p>
              </button>
            ))}
          </div>

          <div className="mt-5">
            <p className="mb-2 text-sm text-ink-2">
              {selected ? (
                <>
                  Reviews that mention <b className="text-ink">{ASPECTS.find((a) => a.key === selected)!.label.toLowerCase()}</b> ({list.length}){" "}
                  <button className="ml-2 text-jev-soft hover:underline" onClick={() => setSelected(null)}>
                    clear
                  </button>
                </>
              ) : (
                "All reviews"
              )}
            </p>
            <div className="grid max-h-80 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
              {list.map((r) => (
                <div key={r.id} className={cn("rounded-xl border border-line bg-surface-2 p-3 text-sm", r.id <= progress && "border-line-2")}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-2">{r.author}</span>
                    <span className={cn("rounded px-1.5 py-0.5 font-semibold text-white", r.rating >= 4 ? "bg-good" : r.rating === 3 ? "bg-[#a3740a]" : "bg-critical")}>{r.rating} ★</span>
                  </div>
                  <p className="mt-1.5 leading-relaxed text-ink">
                    <Highlight text={r.text} terms={terms} />
                  </p>
                  {selected && r.aspects[selected] !== undefined && (
                    <p className="mt-1.5 font-mono text-[11px] text-jev-soft">
                      {selected}_mentioned: 0.9x · {selected}_rating: {r.aspects[selected]}/5
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </Reveal>
    </Section>
  );
}

function Highlight({ text, terms }: { text: string; terms: readonly string[] }) {
  if (!terms.length) return <>{text}</>;
  const re = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return (
    <>
      {text.split(re).map((part, i) =>
        terms.some((t) => t.toLowerCase() === part.toLowerCase()) ? (
          <mark key={i} className="rounded bg-jev/25 px-0.5 text-ink">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
