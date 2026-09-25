"use client";

import { useState } from "react";
import { Button, Card, CodeBlock, Pill, cn } from "@/components/ui";
import { LabError, callBert, callJevAspects, newRunId } from "@/lib/lab/client";
import { DEFAULT_ASPECTS, LABEL_DISPLAY, type AspectResult, type BertSentimentResponse } from "@/lib/lab/shared";
import { jevHint, type Health } from "./Lab";
import { ms } from "./SentimentCard";

const SAMPLE =
  "Display is gorgeous and super bright outdoors. Battery barely lasts till evening though, and it heats up while gaming. For ₹18k it's still decent value.";

export function AspectsTab({ health }: { health: Health | null }) {
  const [text, setText] = useState(SAMPLE);
  const [aspects, setAspects] = useState<string[]>(DEFAULT_ASPECTS);
  const [newA, setNewA] = useState("");
  const [threshold, setThreshold] = useState(0.5);
  const [busy, setBusy] = useState(false);
  const [jev, setJev] = useState<{ aspects: AspectResult[]; ms: number; questions: number; provider: string } | null>(null);
  const [bert, setBert] = useState<BertSentimentResponse | null>(null);
  const [err, setErr] = useState<{ msg: string; code?: string } | null>(null);

  const run = async () => {
    setBusy(true);
    setErr(null);
    const [j, b] = await Promise.allSettled([callJevAspects(text, aspects, newRunId()), callBert(text)]);
    if (j.status === "fulfilled") setJev({ aspects: j.value.data.aspects, ms: j.value.client_ms, questions: j.value.data.questions, provider: j.value.data.provider });
    else {
      setJev(null);
      setErr({ msg: (j.reason as LabError).message, code: (j.reason as LabError).code });
    }
    setBert(b.status === "fulfilled" ? b.value.data : null);
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <p className="text-sm text-ink-2">
          Moodify&apos;s BERT outputs <b className="text-ink">one label per review</b>, because that&apos;s what it was fine-tuned for.
          Getting per-aspect ratings like Flipkart&apos;s would mean new labelled data and new training for every aspect. With JEV you{" "}
          <b className="text-ink">type an aspect name and it works</b>: two questions per aspect, all in one call.
        </p>
        <textarea
          rows={3}
          value={text}
          maxLength={4000}
          onChange={(e) => setText(e.target.value)}
          className="mt-4 w-full resize-y rounded-xl border border-line bg-surface-2 p-3 text-sm outline-none focus:border-jev/60"
          aria-label="Review text"
        />
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {aspects.map((a) => (
            <span key={a} className="inline-flex items-center gap-1 rounded-lg border border-line-2 bg-surface-2 py-1 pl-2.5 pr-1 text-xs">
              {a}
              <button aria-label={`Remove ${a}`} onClick={() => setAspects((xs) => xs.filter((x) => x !== a))} className="rounded px-1 text-ink-3 hover:text-critical">
                ×
              </button>
            </span>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const a = newA.trim().toLowerCase();
              if (a && !aspects.includes(a) && aspects.length < 10 && a.length <= 40) setAspects((xs) => [...xs, a]);
              setNewA("");
            }}
          >
            <input
              value={newA}
              onChange={(e) => setNewA(e.target.value)}
              placeholder="+ add aspect (e.g. speakers)"
              className="w-48 rounded-lg border border-dashed border-line-2 bg-transparent px-2.5 py-1 text-xs outline-none focus:border-jev/60"
            />
          </form>
          <Button className="ml-auto" onClick={run} disabled={busy || !aspects.length || !text.trim()}>
            {busy ? "Analysing…" : `Ask ${aspects.length * 2} questions ▶`}
          </Button>
        </div>
      </Card>

      {err && (
        <div className="rounded-xl border border-critical/40 bg-critical/5 p-3 text-sm">
          <p className="text-[#f08a8a]">JEV: {err.msg}</p>
          {jevHint(err.msg, err.code) && <p className="mt-1 text-ink-2">{jevHint(err.msg, err.code)}</p>}
        </div>
      )}

      {(jev || bert) && (
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <Card className="border-jev/30">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-jev-soft">JEV · per-aspect</p>
              {jev && (
                <span className="font-mono text-xs text-ink-3">
                  {jev.questions} questions · 1 call · {ms(jev.ms)} {jev.provider === "mock" && "· MOCK"}
                </span>
              )}
            </div>
            <label className="mt-3 flex items-center gap-3 text-xs text-ink-2">
              “mentioned” threshold <b className="font-mono text-ink">{threshold.toFixed(2)}</b>
              <input type="range" min={0.1} max={0.95} step={0.05} value={threshold} onChange={(e) => setThreshold(+e.target.value)} className="flex-1" />
            </label>
            <div className="mt-4 space-y-2">
              {jev?.aspects.map((a) => {
                const on = a.mentioned >= threshold && a.score !== null;
                return (
                  <div key={a.name} className={cn("grid grid-cols-[minmax(5rem,8rem)_1fr_7rem] items-center gap-3 rounded-lg px-2 py-1.5 text-sm", !on && "opacity-45")}>
                    <span className="truncate">{a.name}</span>
                    <div className="h-2.5 rounded-full bg-surface-3">
                      {on && <div className="h-full rounded-full bg-jev" style={{ width: `${((a.score! - 1) / 4) * 100}%` }} />}
                    </div>
                    <span className="whitespace-nowrap text-right font-mono text-xs">
                      {on ? `${a.score!.toFixed(1)}★` : "not mentioned"}
                      <span className="block text-[10px] text-ink-3">p(mention) {a.mentioned.toFixed(2)}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="border-llm/30">
            <p className="font-medium text-llm-soft">BERT · what it can give you</p>
            {bert ? (
              <>
                <p className="mt-3 text-2xl font-semibold">{LABEL_DISPLAY[bert.label]}</p>
                <p className="text-xs text-ink-3">
                  one overall label · confidence {bert.confidence.toFixed(2)} · {ms(bert.upstream_ms)}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-ink-3">BERT service offline.</p>
            )}
            <div className="mt-4 space-y-2 text-sm text-ink-2">
              <p>To match the left panel, BERT would need:</p>
              <ul className="list-inside list-disc space-y-1 text-xs">
                <li>Hundreds of reviews labelled per aspect (mentioned? + rating)</li>
                <li>A multi-head fine-tune (7 aspects × 2 outputs)</li>
                <li>Re-labelling and re-training for every new aspect you add</li>
              </ul>
              <Pill tone="jev" className="mt-2">
                JEV: 0 labels · 0 training · add aspects live
              </Pill>
            </div>
          </Card>
        </div>
      )}

      <CodeBlock
        lang="the request this tab sends (TypeSafe shape)"
        code={JSON.stringify(
          {
            model: health?.jev.model ?? "jev-latest",
            state: "<review text>",
            questions: {
              camera__mentioned: { type: "noul", instructions: "Does the reviewer describe an opinion or experience about the camera?" },
              camera__rating: { type: "score", instructions: "How satisfied is the reviewer with the camera?", criteria: ["very unhappy", "unhappy", "neutral", "happy", "very happy"] },
              "…": "2 questions per aspect",
            },
          },
          null,
          2,
        )}
      />
    </div>
  );
}
