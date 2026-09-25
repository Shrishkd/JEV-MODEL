"use client";

import { useCallback, useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { BLOG_URL } from "@/lib/links";
import { Pill, Tabs } from "@/components/ui";
import { CurrencyToggle } from "@/lib/currency";
import { RaceTab } from "./RaceTab";
import { BenchmarkTab } from "./BenchmarkTab";
import { AspectsTab } from "./AspectsTab";
import { SetupTab } from "./SetupTab";

export type Health = {
  jev: { id: "typesafe" | "vercel" | "mock"; model: string; configured: boolean };
  bert: { ok: boolean; model?: string; device?: string; load_seconds?: number; error?: string };
};

type Tab = "race" | "bench" | "aspects" | "setup";

export function Lab() {
  const [tab, setTab] = useState<Tab>("race");
  const [health, setHealth] = useState<Health | null>(null);

  const refresh = useCallback(async () => {
    try {
      setHealth(await fetch("/api/health", { cache: "no-store" }).then((r) => r.json()));
    } catch {
      setHealth(null);
    }
  }, []);
  useEffect(() => {
    fetch("/api/health", { cache: "no-store" })
      .then((r) => r.json())
      .then(setHealth, () => setHealth(null));
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <a href={BLOG_URL} className="flex items-center gap-2 font-semibold" title="Back to the JEV explainer">
            <Logo /> <span className="hidden sm:inline">JEV.explained</span>
          </a>
          <span className="text-ink-3">/</span>
          <span className="font-medium">BERT vs JEV Lab</span>
          <div className="ml-auto">
            <CurrencyToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-jev-soft">Moodify 2.0 · real models, real APIs</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Fine-tuned <span className="text-llm-soft">BERT</span> vs zero-shot <span className="text-jev-soft">JEV</span>
          </h1>
          <p className="mt-3 text-ink-2">
            The same 5-class sentiment task Moodify solves (Very Negative → Very Positive), run on{" "}
            <code className="font-mono text-sm">nlptown/bert-base-multilingual-uncased-sentiment</code> and on JEV with the five classes
            described in plain English. Compare latency, accuracy, calibration and cost, then try what BERT can&apos;t do.
          </p>
        </div>

        <StatusBar health={health} onRefresh={refresh} onSetup={() => setTab("setup")} />

        <div className="mt-8">
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "race", label: "⚡ Head-to-head" },
              { id: "bench", label: "📊 Benchmark" },
              { id: "aspects", label: "🧩 Beyond BERT: aspects" },
              { id: "setup", label: "⚙️ Setup" },
            ]}
          />
          <div className="mt-6">
            {tab === "race" && <RaceTab health={health} />}
            {tab === "bench" && <BenchmarkTab health={health} />}
            {tab === "aspects" && <AspectsTab health={health} />}
            {tab === "setup" && <SetupTab health={health} onRefresh={refresh} />}
          </div>
        </div>
      </main>
    </>
  );
}

function StatusBar({ health, onRefresh, onSetup }: { health: Health | null; onRefresh: () => void; onSetup: () => void }) {
  const jev = health?.jev;
  const bert = health?.bert;
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-3 text-sm">
      <span className="text-ink-3">Status:</span>
      {!health ? (
        <Pill>checking…</Pill>
      ) : (
        <>
          <Pill tone={!jev ? "critical" : jev.id === "mock" ? "warn" : jev.configured ? "jev" : "critical"}>
            JEV · {jev?.id === "vercel" ? "Vercel AI Gateway" : jev?.id === "typesafe" ? "TypeSafe direct" : "MOCK (no key)"}
            {jev && jev.id !== "mock" && !jev.configured && " · key missing"}
          </Pill>
          <Pill tone={bert?.ok ? "good" : "critical"}>
            BERT · {bert?.ok ? `online (${bert.device})` : "offline"}
          </Pill>
        </>
      )}
      <button onClick={onRefresh} className="ml-auto text-xs text-ink-3 hover:text-ink">
        ↻ recheck
      </button>
      {(health?.jev.id === "mock" || !health?.bert.ok) && (
        <button onClick={onSetup} className="text-xs text-jev-soft hover:underline">
          how to fix →
        </button>
      )}
    </div>
  );
}

/** Friendly explanation for common JEV errors. */
export function jevHint(message: string, code?: string) {
  if (code === "customer_verification_required" || /credit card/i.test(message))
    return "Vercel AI Gateway needs a card on file before it serves requests (it also unlocks free credits). Add one at vercel.com → AI Gateway, then retry.";
  if (code === "missing_key") return "No API key configured. Add AI_GATEWAY_API_KEY or TYPESAFE_API_KEY to .env.local and restart `npm run dev`.";
  if (/401|unauthori[sz]ed|invalid.*key/i.test(message)) return "The API key was rejected. Check it in .env.local.";
  if (/429|rate/i.test(message)) return "Rate-limited. Wait a moment, or lower concurrency in the benchmark.";
  return null;
}
