"use client";

import { useState } from "react";
import { Card, Reveal, Section, cn } from "@/components/ui";
import { COMPARE_URL } from "@/lib/links";

const VIDEO_ID = "0zFfcEr1e9U";

const CHAPTERS: [number, string][] = [
  [0, "Why cover JEV so soon: signal vs noise"],
  [151, "What is JEV? A decision model, not an LLM"],
  [414, "Speed & cost vs GPT-5 (live demo)"],
  [703, "Many questions per call, confidence, no hallucination"],
  [1189, "Who built it (Diogo Almeida, TypeSafe) and why"],
  [1328, "System 1 vs System 2 thinking"],
  [1539, "Impact: AI from feature to primitive"],
  [1672, "Where it fits: agents, ops, safety, real time"],
  [1927, "The intelligence trade-off"],
  [2111, "Community demos (awesome-jev-use-cases)"],
  [2639, "Laya: the earlier competitor"],
  [2699, "Live build: Flipkart-style review aspects"],
  [3293, "Architecture: what is actually known"],
  [3809, "Decoder or encoder? The MMLU clue"],
  [4001, "Prefill vs decode, and the answer head"],
  [4349, "Training: synthetic data + RLCD"],
  [4783, "Downsides"],
  [5042, "Seven predictions"],
];

const CORRECTIONS = [
  ["Model size: unknown", "The video suggests both “30–70B-class” and “under a billion parameters”. Neither is confirmed."],
  ["Costs are in rupees", "The video's “Rs.119 / Rs.956 per million” is GPT-5's $1.25 / $10 at ≈₹95/$. JEV's “Rs.4” is $0.042."],
  ["“Can't hallucinate” ≠ “can't be wrong”", "It can't output an invalid option, but it can still choose the wrong one. That's why the confidence score matters."],
  ["The calibration curve was illustrative", "The video itself noted the figure wasn't real data. Archer Hume has since measured ECE ≈ 0.031 on 1,200 MMLU-Pro items."],
  ["MMLU → MMLU-Pro", "The 84.6% the video quotes comes from Archer Hume's probe, and it's MMLU-Pro, the harder variant."],
];

const RESOURCES: { title: string; by: string; what: string; url: string }[] = [
  { title: "TypeSafe docs: Introduction", by: "docs.typesafe.ai", what: "The official starting point: System One models, and the Choice / Score / Noul primitives.", url: "https://docs.typesafe.ai/introduction" },
  { title: "awesome-jev-use-cases", by: "GitHub · walidboulanouar", what: "74 community demos ranked by engagement, in 7 categories. The source of the use-case gallery above.", url: "https://github.com/walidboulanouar/awesome-jev-use-cases" },
  { title: "Ship with Jev: GitHub projects", by: "shipwithjev.com", what: "A hand-sorted catalogue of 278 open-source projects built with JEV: agents, games, research, tools, trading.", url: "https://www.shipwithjev.com/type/github" },
  { title: "Jev's Architecture Unmasked", by: "Archer Hume · 17 Sept 2026", what: "Reverse-engineering from ~10k API calls: shared state + isolated question branches, MMLU-Pro 84.6%, ECE 0.031, likely sparse MoE.", url: "https://archerhume.com/posts/jevs-architecture-unmasked" },
  { title: "Building a Harness with Jev", by: "LangChain blog · 17 Sept 2026", what: "Where JEV fits inside agent loops: fast typed decisions alongside a conventional LLM.", url: "https://www.langchain.com/blog/building-a-harness-with-jev" },
  { title: "JevBench v1.4.2", by: "Benchmark Heaven", what: "Independent leaderboard for decision models on intelligence, calibration, speed and cost.", url: "https://benchmarkheaven.com/jev-models" },
];

export function VideoNotes() {
  const [start, setStart] = useState(0);
  const [nonce, setNonce] = useState(0);
  const fmt = (s: number) => `${Math.floor(s / 3600) ? Math.floor(s / 3600) + ":" : ""}${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <Section
      id="video"
      eyebrow="13 · Study notes"
      title="Video notes: CampusX on JEV"
      lead="Everything above is built from this session plus current documentation. Jump to any chapter. Clicking a chapter restarts the embedded video at that point."
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Reveal>
          <div className="overflow-hidden rounded-2xl border border-line bg-black">
            <div className="relative aspect-video">
              <iframe
                key={nonce}
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?start=${start}${nonce ? "&autoplay=1" : ""}`}
                title="Jev by TypeSafe AI: What is a System-1 Decision Model (CampusX)"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.06}>
          <Card className="max-h-[27rem] overflow-y-auto p-2 sm:p-2">
            <ol>
              {CHAPTERS.map(([t, title]) => (
                <li key={t}>
                  <button
                    onClick={() => {
                      setStart(t);
                      setNonce((n) => n + 1);
                    }}
                    className={cn("flex w-full gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-2", start === t && nonce > 0 && "bg-surface-2")}
                  >
                    <span className="w-14 shrink-0 font-mono text-xs leading-5 text-jev-soft">{fmt(t)}</span>
                    <span className="text-ink-2">{title}</span>
                  </button>
                </li>
              ))}
            </ol>
          </Card>
        </Reveal>
      </div>

      <Reveal>
        <Card className="mt-6">
          <h3 className="text-lg font-semibold">Resources: where I learned about JEV</h3>
          <p className="mt-1 text-sm text-ink-2">Start with the docs, then the architecture post, then browse the demos.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {RESOURCES.map((r) => (
              <a
                key={r.url}
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="group rounded-xl border border-line bg-surface-2 p-3 transition-colors hover:border-jev/50"
              >
                <p className="text-sm font-medium group-hover:text-jev-soft">{r.title} ↗</p>
                <p className="mt-0.5 font-mono text-[11px] text-ink-3">{r.by}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-2">{r.what}</p>
              </a>
            ))}
          </div>
        </Card>
      </Reveal>

      <Reveal>
        <Card className="mt-6">
          <h3 className="text-lg font-semibold">Corrections &amp; clarifications</h3>
          <p className="mt-1 text-sm text-ink-2">Where the session and today&apos;s facts differ, or where it was speculating:</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {CORRECTIONS.map(([t, d]) => (
              <div key={t} className="rounded-xl border border-line bg-surface-2 p-3">
                <p className="text-sm font-medium">{t}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-2">{d}</p>
              </div>
            ))}
          </div>
        </Card>
      </Reveal>

      <Reveal>
        <a href={COMPARE_URL} className="group mt-6 block">
          <div className="relative overflow-hidden rounded-2xl border border-jev/40 bg-gradient-to-br from-jev/15 via-surface to-surface p-6 transition-colors group-hover:border-jev sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan/10 blur-3xl" />
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-jev-soft">Hands-on · real APIs</p>
            <h3 className="mt-2 text-2xl font-semibold">BERT vs JEV Lab →</h3>
            <p className="mt-2 max-w-2xl text-ink-2">
              Everything on this page is simulated for teaching. The lab runs <b className="text-ink">Moodify&apos;s real BERT model</b>{" "}
              against the <b className="text-ink">real JEV API</b> on the same reviews and measures latency, accuracy, calibration and
              cost side by side. It also shows what BERT can&apos;t do: aspect ratings with zero retraining.
            </p>
          </div>
        </a>
      </Reveal>
    </Section>
  );
}
