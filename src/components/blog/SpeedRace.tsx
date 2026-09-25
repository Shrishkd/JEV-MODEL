"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Button, Card, SimBadge, Tabs, cn } from "@/components/ui";
import { sampleJevLatency, sampleLlmLatency } from "@/lib/sim/pseudoJev";

const LLM_TEXT_1 = `{"category": "billing"}`;
const LLM_TEXT_5 = `{"queue":"shipping","urgent":true,"refund":true,"sentiment":2,"language":"english"}`;

type Result = { jev: number; llm: number; mode: "1" | "5" };

export function SpeedRace() {
  const [mode, setMode] = useState<"1" | "5">("1");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [target, setTarget] = useState<{ jev: number; llm: number } | null>(null);
  const [history, setHistory] = useState<Result[]>([]);
  const raf = useRef<number>(0);

  const start = () => {
    const jev = sampleJevLatency() + (mode === "5" ? 15 : 0);
    const llm = Math.round(sampleLlmLatency() * (mode === "5" ? 1.35 : 1));
    setTarget({ jev, llm });
    setRunning(true);
    const t0 = performance.now();
    const tick = () => {
      const e = performance.now() - t0;
      setElapsed(e);
      if (e < llm) raf.current = requestAnimationFrame(tick);
      else {
        setRunning(false);
        setHistory((h) => [{ jev, llm, mode }, ...h].slice(0, 6));
      }
    };
    raf.current = requestAnimationFrame(tick);
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const jevDone = target && elapsed >= target.jev;
  const llmDone = target && elapsed >= target.llm;
  const llmText = mode === "1" ? LLM_TEXT_1 : LLM_TEXT_5;
  // LLM: ~55% of the time "thinking", then streams the answer token by token.
  const thinkEnd = target ? target.llm * 0.55 : 0;
  const streamed = target && elapsed > thinkEnd ? Math.floor(((elapsed - thinkEnd) / (target.llm - thinkEnd)) * llmText.length) : 0;
  const avg = history.length ? history.reduce((a, r) => a + r.llm / r.jev, 0) / history.length : 0;

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold">Speed race</h3>
          <SimBadge />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs
            value={mode}
            onChange={(m) => !running && setMode(m)}
            tabs={[
              { id: "1", label: "1 question" },
              { id: "5", label: "5 questions" },
            ]}
          />
          <Button onClick={start} disabled={running}>
            {running ? "Racing…" : history.length ? "Race again" : "Start race"}
          </Button>
        </div>
      </div>
      <p className="mt-2 text-sm text-ink-2">
        The task is to classify a support message. Latencies are drawn from ranges in the video&apos;s live demo (GPT-5 took 6.58 s and
        4.19 s, JEV took 472 ms and 781 ms) and TypeSafe&apos;s published range (70–500 ms vs 3–329 s).
      </p>

      <div className="mt-5 space-y-4">
        <Lane
          name="JEV"
          sub="one forward pass → answer head"
          tone="jev"
          progress={target ? Math.min(1, elapsed / target.jev) : 0}
          done={!!jevDone}
          time={target ? Math.min(elapsed, target.jev) : 0}
          body={
            jevDone ? (
              <span className="font-mono text-xs text-jev-soft">
                {mode === "1" ? "choice: billing · p=0.94" : "5 typed answers ✓"}
              </span>
            ) : running ? (
              <span className="text-xs text-ink-3">deciding…</span>
            ) : null
          }
        />
        <Lane
          name="Frontier LLM"
          sub="reasoning + token-by-token JSON"
          tone="llm"
          progress={target ? Math.min(1, elapsed / target.llm) : 0}
          done={!!llmDone}
          time={target ? Math.min(elapsed, target.llm) : 0}
          body={
            running && elapsed < thinkEnd ? (
              <span className="text-xs text-ink-3">
                thinking<span className="animate-pulse">…</span> ({Math.round(elapsed / 18)} reasoning tokens)
              </span>
            ) : target ? (
              <span className="font-mono text-xs text-llm-soft">
                {llmText.slice(0, llmDone ? llmText.length : streamed)}
                {!llmDone && <span className="animate-blink">▍</span>}
              </span>
            ) : null
          }
        />
      </div>

      {target && llmDone && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-jev/30 bg-jev/5 p-4">
          <p className="text-3xl font-semibold text-jev-soft">{(target.llm / target.jev).toFixed(1)}× faster</p>
          <p className="text-sm text-ink-2">
            Both answers are correct. JEV finished {((target.llm - target.jev) / 1000).toFixed(2)} s sooner.
            {history.length > 1 && (
              <>
                {" "}
                Average over {history.length} races: <b className="text-ink">{avg.toFixed(1)}×</b>.
              </>
            )}
          </p>
        </motion.div>
      )}
    </Card>
  );
}

function Lane({
  name,
  sub,
  tone,
  progress,
  done,
  time,
  body,
}: {
  name: string;
  sub: string;
  tone: "jev" | "llm";
  progress: number;
  done: boolean;
  time: number;
  body: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-3">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium">
          <span className={tone === "jev" ? "text-jev-soft" : "text-llm-soft"}>{name}</span>
          <span className="ml-2 text-xs text-ink-3">{sub}</span>
        </p>
        <p className={cn("font-mono text-sm tabular-nums", done ? (tone === "jev" ? "text-jev-soft" : "text-llm-soft") : "text-ink-2")}>
          {time < 1000 ? `${Math.round(time)} ms` : `${(time / 1000).toFixed(2)} s`} {done && "✓"}
        </p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-3">
        <div className={cn("h-full rounded-full", tone === "jev" ? "bg-jev" : "bg-llm")} style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="mt-2 min-h-5">{body}</div>
    </div>
  );
}
