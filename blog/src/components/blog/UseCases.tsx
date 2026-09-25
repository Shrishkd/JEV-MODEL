"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Card, Reveal, Section, cn } from "@/components/ui";
import { CATEGORY_COUNTS, USE_CASES, type UseCaseCategory } from "@/lib/data/useCases";

const CATS = Object.keys(CATEGORY_COUNTS) as UseCaseCategory[];
const ICON: Record<UseCaseCategory, string> = {
  "Content & growth": "📣",
  "Apps & tools": "🧰",
  "Agents & computer use": "🤖",
  "Triage & routing": "🔀",
  "Games & real time": "🎮",
  "Research & data": "🔬",
  "Trading & markets": "📈",
};

export function UseCases() {
  const [cat, setCat] = useState<UseCaseCategory | "All">("All");
  const list = (cat === "All" ? USE_CASES : USE_CASES.filter((u) => u.category === cat)).sort((a, b) => b.likes - a.likes);
  const total = Object.values(CATEGORY_COUNTS).reduce((a, b) => a + b, 0);

  return (
    <Section
      id="use-cases"
      eyebrow="09 · What people built in week one"
      title="From slop detectors to Doom-playing agents"
      lead={
        <>
          Within days the community had built {total}+ demos, collected in{" "}
          <a className="text-jev-soft underline-offset-2 hover:underline" href="https://github.com/walidboulanouar/awesome-jev-use-cases" target="_blank" rel="noreferrer">
            awesome-jev-use-cases
          </a>
          . They share one trick: turn the situation into <b className="text-ink">text state</b> (JEV is text-only, so game screens and web
          pages get serialised) and ask a <b className="text-ink">small typed question</b> on every event.
        </>
      }
    >
      <Reveal>
        {/* Category distribution: one sorted bar per category */}
        <div className="mb-6 grid gap-1.5 sm:grid-cols-2">
          {CATS.map((c) => (
            <button key={c} onClick={() => setCat(cat === c ? "All" : c)} className="group grid grid-cols-[11rem_1fr_2rem] items-center gap-3 text-left text-sm">
              <span className={cn("truncate", cat === c ? "text-ink" : "text-ink-2 group-hover:text-ink")}>
                {ICON[c]} {c}
              </span>
              <span className="h-2.5 rounded-r bg-surface-3">
                <span className={cn("block h-full rounded-r transition-colors", cat === c ? "bg-jev" : "bg-jev/50 group-hover:bg-jev/80")} style={{ width: `${(CATEGORY_COUNTS[c] / 18) * 100}%` }} />
              </span>
              <span className="text-right font-mono text-xs text-ink-3">{CATEGORY_COUNTS[c]}</span>
            </button>
          ))}
        </div>
        <div className="mb-6 flex flex-wrap gap-1.5">
          {(["All", ...CATS] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                cat === c ? "border-jev bg-jev/15 text-ink" : "border-line bg-surface-2 text-ink-2 hover:text-ink",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </Reveal>

      <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {list.map((u) => (
            <motion.div key={u.title} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}>
              <Card className="flex h-full flex-col transition-colors hover:border-line-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs text-ink-3">
                    {ICON[u.category]} {u.category}
                  </span>
                  <span className="font-mono text-[11px] text-ink-3">♥ {u.likes.toLocaleString()}</span>
                </div>
                <h3 className="mt-2 font-semibold">{u.title}</h3>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-ink-2">{u.blurb}</p>
                {u.metric && <p className="mt-2 text-sm font-medium text-jev-soft">{u.metric}</p>}
                <div className="mt-3 rounded-lg border border-line bg-surface-2 p-2.5 font-mono text-[11px] leading-relaxed">
                  <p className="text-ink-3">
                    state: <span className="text-ink-2">{u.decision.state}</span>
                  </p>
                  <p className="text-ink-3">
                    ask: <span className="text-ink-2">{u.decision.question}</span>
                  </p>
                  <p className="text-jev-soft">→ {u.decision.answer}</p>
                </div>
                <a href={u.url} target="_blank" rel="noreferrer" className="mt-3 text-xs text-ink-3 hover:text-jev-soft">
                  {u.author} on X ↗
                </a>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      <p className="mt-6 text-xs text-ink-3">
        The decision snippets are illustrative reconstructions of each demo&apos;s core question. See the original posts for details.
      </p>
    </Section>
  );
}
