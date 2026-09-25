"use client";

import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { Card, CodeBlock, Pill, Reveal, Section, SimBadge, cn } from "@/components/ui";
import { mulberry32 } from "@/lib/sim/pseudoJev";

export function Calibration() {
  return (
    <Section
      id="calibration"
      eyebrow="06 · Confidence you can branch on"
      title={
        <>
          Calibrated confidence and <span className="text-jev-soft">RLCD</span>
        </>
      }
      lead={
        <>
          Every JEV answer comes with a confidence number that is <b className="text-ink">trained to be honest</b>. When it says 90%, it
          should be right about 90% of the time. TypeSafe calls the training method <b className="text-ink">RLCD</b>, Reinforcement
          Learning for Calibrated Decisions (sometimes misheard as &ldquo;RLCV&rdquo;). LLMs are known to overstate their confidence. An
          honest number lets you write code that trusts the easy cases and escalates the hard ones.
        </>
      }
    >
      <div className="space-y-6">
        <Reveal>
          <ConfidenceRouting />
        </Reveal>
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal>
            <ReliabilityDiagram />
          </Reveal>
          <Reveal delay={0.06}>
            <ScoringRule />
          </Reveal>
        </div>
        <Reveal>
          <RlhfVsRlcd />
        </Reveal>
      </div>
    </Section>
  );
}

/* ---------------- Confidence routing ---------------- */

type Ticket = { id: number; conf: number; correct: boolean };

function ConfidenceRouting() {
  const [lo, setLo] = useState(0.6);
  const [hi, setHi] = useState(0.9);
  const tickets = useMemo<Ticket[]>(() => {
    const r = mulberry32(7);
    return Array.from({ length: 80 }, (_, id) => {
      // Skewed towards high confidence, as for a well-posed task.
      const conf = Math.min(0.995, 0.3 + 0.7 * Math.pow(r(), 0.3));
      return { id, conf, correct: r() < conf }; // calibrated by construction
    });
  }, []);

  const lanes = {
    auto: tickets.filter((t) => t.conf >= hi),
    follow: tickets.filter((t) => t.conf >= lo && t.conf < hi),
    human: tickets.filter((t) => t.conf < lo),
  };
  const autoErr = lanes.auto.filter((t) => !t.correct).length;

  const code = `const { choice, confidence } = answers.queue;

if (confidence >= ${hi.toFixed(2)}) {
  forwardTo(choice);        // ${lanes.auto.length}/80 automatic
} else if (confidence >= ${lo.toFixed(2)}) {
  askFollowUpQuestion();    // ${lanes.follow.length}/80 one more JEV call
} else {
  sendToHumanReview();      // ${lanes.human.length}/80 to people
}`;

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold">Confidence-based routing</h3>
        <SimBadge />
      </div>
      <p className="mt-1 text-sm text-ink-2">
        The pattern from the video: above 90%, act automatically. Between 60% and 90%, ask a follow-up. Below 60%, send it to a
        human. Drag the thresholds and watch 80 tickets re-route.
      </p>
      <div className="mt-5 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="flex justify-between text-ink-2">
                Human-review below <b className="font-mono text-ink">{lo.toFixed(2)}</b>
              </span>
              <input type="range" className="mt-2 w-full" min={0.3} max={0.85} step={0.01} value={lo} onChange={(e) => setLo(Math.min(+e.target.value, hi - 0.05))} />
            </label>
            <label className="block text-sm">
              <span className="flex justify-between text-ink-2">
                Auto-act at or above <b className="font-mono text-ink">{hi.toFixed(2)}</b>
              </span>
              <input type="range" className="mt-2 w-full" min={0.5} max={0.99} step={0.01} value={hi} onChange={(e) => setHi(Math.max(+e.target.value, lo + 0.05))} />
            </label>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {(
              [
                ["auto", "Automatic", "jev", lanes.auto],
                ["follow", "Follow-up question", "warn", lanes.follow],
                ["human", "Human review", "critical", lanes.human],
              ] as const
            ).map(([k, label, tone, list]) => (
              <div key={k} className="rounded-xl border border-line bg-surface-2 p-3">
                <div className="flex items-center justify-between">
                  <Pill tone={tone}>{label}</Pill>
                  <span className="font-mono text-sm">{list.length}</span>
                </div>
                <div className="mt-3 flex min-h-[4.5rem] flex-wrap content-start gap-1">
                  {list.map((t) => (
                    <motion.span
                      layout
                      layoutId={`t${t.id}`}
                      key={t.id}
                      title={`confidence ${t.conf.toFixed(2)} · ${t.correct ? "correct" : "wrong"}`}
                      className={cn(
                        "h-3 w-3 rounded-[3px]",
                        k === "auto" ? "bg-jev" : k === "follow" ? "bg-warn" : "bg-critical",
                        !t.correct && "ring-2 ring-white/80 ring-offset-1 ring-offset-surface-2",
                      )}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-ink-2">
            In the automatic lane: <b className="text-ink">{autoErr}</b> wrong out of {lanes.auto.length} (
            {lanes.auto.length ? ((autoErr / lanes.auto.length) * 100).toFixed(1) : 0}% error, ringed squares). Because the
            confidence is calibrated, you can predict that error rate <i>before</i> shipping.
          </p>
        </div>
        <CodeBlock code={code} lang="typescript · your business logic" />
      </div>
    </Card>
  );
}

/* ---------------- Reliability diagram ---------------- */

const BINS = [0.55, 0.65, 0.75, 0.85, 0.95];
const SERIES = [
  { id: "jev", name: "Calibrated (RLCD-style)", color: "var(--color-jev)", acc: [0.56, 0.66, 0.74, 0.86, 0.94] },
  { id: "llm", name: "Overconfident LLM", color: "var(--color-llm)", acc: [0.41, 0.47, 0.55, 0.63, 0.72] },
];

function ReliabilityDiagram() {
  const [hover, setHover] = useState<{ s: number; b: number } | null>(null);
  const W = 320;
  const H = 260;
  const pad = { l: 40, r: 12, t: 12, b: 36 };
  const x = (v: number) => pad.l + ((v - 0.5) / 0.5) * (W - pad.l - pad.r);
  const y = (v: number) => H - pad.b - ((v - 0.3) / 0.7) * (H - pad.t - pad.b);

  return (
    <Card className="h-full">
      <h3 className="text-lg font-semibold">Reliability diagram</h3>
      <p className="mt-1 text-sm text-ink-2">
        Stated confidence (x) vs how often the answer was actually right (y). The dashed line is perfect honesty. Points below it mean
        the model claims more than it delivers.
      </p>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-ink-2">
        {SERIES.map((s) => (
          <span key={s.id} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} /> {s.name}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 border-t border-dashed border-ink-3" /> perfect calibration
        </span>
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" role="img" aria-label="Reliability diagram comparing a calibrated model and an overconfident LLM">
          {[0.3, 0.5, 0.7, 0.9].map((v) => (
            <g key={v}>
              <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="var(--color-line)" strokeWidth="1" />
              <text x={pad.l - 6} y={y(v) + 3} textAnchor="end" fontSize="9.5" fill="var(--color-ink-3)">
                {Math.round(v * 100)}%
              </text>
            </g>
          ))}
          {[0.5, 0.6, 0.7, 0.8, 0.9, 1].map((v) => (
            <text key={v} x={x(v)} y={H - pad.b + 14} textAnchor="middle" fontSize="9.5" fill="var(--color-ink-3)">
              {Math.round(v * 100)}%
            </text>
          ))}
          <text x={(W + pad.l) / 2} y={H - 4} textAnchor="middle" fontSize="10" fill="var(--color-ink-2)">
            stated confidence
          </text>
          <text x={10} y={(H - pad.b) / 2} textAnchor="middle" fontSize="10" fill="var(--color-ink-2)" transform={`rotate(-90 10 ${(H - pad.b) / 2})`}>
            actual accuracy
          </text>
          <line x1={x(0.5)} y1={y(0.5)} x2={x(1)} y2={y(1)} stroke="var(--color-ink-3)" strokeDasharray="4 4" />
          {SERIES.map((s, si) => (
            <g key={s.id}>
              <motion.polyline
                fill="none"
                stroke={s.color}
                strokeWidth="2"
                points={BINS.map((b, i) => `${x(b)},${y(s.acc[i])}`).join(" ")}
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: si * 0.3 }}
              />
              {BINS.map((b, i) => (
                <g key={b}>
                  <circle cx={x(b)} cy={y(s.acc[i])} r={hover?.s === si && hover.b === i ? 6 : 4.5} fill={s.color} stroke="var(--color-surface)" strokeWidth="2" />
                  <circle cx={x(b)} cy={y(s.acc[i])} r="12" fill="transparent" onMouseEnter={() => setHover({ s: si, b: i })} onMouseLeave={() => setHover(null)} />
                </g>
              ))}
              <text x={x(0.95) + 4} y={y(s.acc[4]) + (si ? 14 : -8)} fontSize="10" textAnchor="end" fill="var(--color-ink-2)">
                {si ? "LLM" : "JEV-like"}
              </text>
            </g>
          ))}
        </svg>
        {hover && (
          <div
            className="pointer-events-none absolute rounded-lg border border-line-2 bg-surface-3 px-2.5 py-1.5 text-xs shadow-lg"
            style={{ left: `${(x(BINS[hover.b]) / W) * 100}%`, top: `${(y(SERIES[hover.s].acc[hover.b]) / H) * 100}%`, transform: "translate(-50%, -130%)" }}
          >
            <p className="font-medium">{SERIES[hover.s].name}</p>
            <p className="text-ink-2">
              says {Math.round(BINS[hover.b] * 100)}% → right {Math.round(SERIES[hover.s].acc[hover.b] * 100)}%
            </p>
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-ink-3">Illustrative curves, not measured data. TypeSafe hasn&apos;t published a reliability plot.</p>
    </Card>
  );
}

/* ---------------- Why RLCD rewards honesty ---------------- */

function ScoringRule() {
  const [truth, setTruth] = useState(0.7);
  const [stated, setStated] = useState(0.95);
  const brier = (p: number) => truth * (1 - p) ** 2 + (1 - truth) * p ** 2; // expected Brier (binary)
  const W = 320;
  const H = 180;
  const pad = { l: 36, r: 10, t: 10, b: 28 };
  const max = 1;
  const x = (p: number) => pad.l + p * (W - pad.l - pad.r);
  const y = (v: number) => H - pad.b - (v / max) * (H - pad.t - pad.b);
  const pts = Array.from({ length: 51 }, (_, i) => i / 50);

  return (
    <Card className="h-full">
      <h3 className="text-lg font-semibold">Why a calibration reward makes the model honest</h3>
      <p className="mt-1 text-sm text-ink-2">
        Suppose the model is truly right <b className="text-ink">{Math.round(truth * 100)}%</b> of the time on some kind of question. If
        each answer is penalised with a <i>proper scoring rule</i> such as the Brier score, (confidence − outcome)², the lowest
        expected penalty is at a confidence of exactly {Math.round(truth * 100)}%. Bluffing costs more on average.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="flex justify-between text-ink-2">
            True accuracy <b className="font-mono text-ink">{truth.toFixed(2)}</b>
          </span>
          <input type="range" className="mt-2 w-full" min={0.05} max={0.95} step={0.01} value={truth} onChange={(e) => setTruth(+e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="flex justify-between text-ink-2">
            Model says <b className="font-mono text-ink">{stated.toFixed(2)}</b>
          </span>
          <input type="range" className="mt-2 w-full" min={0} max={1} step={0.01} value={stated} onChange={(e) => setStated(+e.target.value)} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label="Expected Brier penalty as a function of stated confidence">
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="var(--color-line)" />
            <text x={pad.l - 5} y={y(v) + 3} textAnchor="end" fontSize="9" fill="var(--color-ink-3)">
              {v}
            </text>
          </g>
        ))}
        {[0, 0.5, 1].map((v) => (
          <text key={v} x={x(v)} y={H - pad.b + 13} textAnchor="middle" fontSize="9" fill="var(--color-ink-3)">
            {v}
          </text>
        ))}
        <text x={(W + pad.l) / 2} y={H - 3} textAnchor="middle" fontSize="9.5" fill="var(--color-ink-2)">
          stated confidence
        </text>
        <polyline fill="none" stroke="var(--color-jev)" strokeWidth="2" points={pts.map((p) => `${x(p)},${y(brier(p))}`).join(" ")} />
        <line x1={x(truth)} x2={x(truth)} y1={pad.t} y2={H - pad.b} stroke="var(--color-good)" strokeDasharray="3 3" />
        <text x={x(truth) + 4} y={pad.t + 10} fontSize="9.5" fill="#5fd35f">
          honest = best
        </text>
        <circle cx={x(stated)} cy={y(brier(stated))} r="5.5" fill="var(--color-llm)" stroke="var(--color-surface)" strokeWidth="2" />
      </svg>
      <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-surface-2 p-2.5">
          <p className="text-xs text-ink-3">Expected penalty if it says {stated.toFixed(2)}</p>
          <p className="font-mono text-llm-soft">{brier(stated).toFixed(3)}</p>
        </div>
        <div className="rounded-lg bg-surface-2 p-2.5">
          <p className="text-xs text-ink-3">If it says the truth ({truth.toFixed(2)})</p>
          <p className="font-mono text-[#5fd35f]">{brier(truth).toFixed(3)}</p>
        </div>
      </div>
    </Card>
  );
}

/* ---------------- RLHF vs RLCD ---------------- */

function RlhfVsRlcd() {
  const rlhf = [
    ["Pre-train", "Predict the next token on web-scale text."],
    ["Supervised fine-tune", "Imitate human-written demonstrations."],
    ["Humans rank outputs", "Labelers compare answers → train a reward model."],
    ["PPO", "Optimise the policy to maximise that reward (with a KL leash)."],
  ];
  const rlcd = [
    ["Pre-trained backbone", "World knowledge from pre-training (likely an existing model)."],
    ["Decision tasks", "Synthetic state + question + options with known correct answers."],
    ["Output a distribution", "Probability for each option, plus a confidence."],
    ["Reward = proper score", "Reward honesty (e.g. Brier / log score); punish over- and under-confidence."],
  ];
  return (
    <Card>
      <h3 className="text-lg font-semibold">RLHF vs RLCD</h3>
      <p className="mt-1 text-sm text-ink-2">
        Almeida worked on <b className="text-ink">RLHF</b>, which made ChatGPT helpful. <b className="text-ink">RLCD</b> applies RL to a
        different target: not &ldquo;what do humans prefer to read?&rdquo; but &ldquo;are the probabilities true?&rdquo;
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Pipeline title="RLHF · Reinforcement Learning from Human Feedback" tone="llm" steps={rlhf} goal="Goal: answers people prefer. Side effect: confident-sounding text gets rewarded, which can make models overconfident." />
        <Pipeline title="RLCD · Reinforcement Learning for Calibrated Decisions" tone="jev" steps={rlcd} goal="Goal: when it says 80%, it's right 80% of the time. That lets you set thresholds in code." />
      </div>
      <p className="mt-4 text-xs leading-relaxed text-ink-3">
        TypeSafe hasn&apos;t published RLCD&apos;s details (reward design, data or the metric it optimises). The right-hand pipeline is
        the standard way to train for calibration and matches public research such as RLCR (RL with calibration rewards, which uses a
        Brier-based reward). The video mentions a Brier-style metric, but treat the specifics as informed speculation.
      </p>
    </Card>
  );
}

function Pipeline({ title, steps, goal, tone }: { title: string; steps: string[][]; goal: string; tone: "jev" | "llm" }) {
  return (
    <div className={cn("rounded-xl border bg-surface-2 p-4", tone === "jev" ? "border-jev/30" : "border-llm/30")}>
      <p className={cn("text-sm font-medium", tone === "jev" ? "text-jev-soft" : "text-llm-soft")}>{title}</p>
      <ol className="mt-3 space-y-2">
        {steps.map(([h, d], i) => (
          <motion.li
            key={h}
            initial={{ opacity: 0, x: -6 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12 }}
            className="flex gap-3"
          >
            <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px]", tone === "jev" ? "bg-jev/20 text-jev-soft" : "bg-llm/20 text-llm-soft")}>
              {i + 1}
            </span>
            <span className="text-sm">
              <b className="font-medium">{h}.</b> <span className="text-ink-2">{d}</span>
            </span>
          </motion.li>
        ))}
      </ol>
      <p className="mt-3 border-t border-line pt-3 text-xs text-ink-2">{goal}</p>
    </div>
  );
}
