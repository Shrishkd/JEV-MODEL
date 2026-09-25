"use client";

import { useMemo, useRef, useState } from "react";
import { LatencyStrip } from "@/components/charts/LatencyStrip";
import { Reliability } from "@/components/charts/Reliability";
import { Button, Card, Pill, Stat, cn } from "@/components/ui";
import { useCurrency } from "@/lib/currency";
import { LAB_SAMPLES } from "@/lib/data/labSamples";
import { LabError, callBert, callJev, csvToItems, labelIndex, newRunId, pool, type LabItem } from "@/lib/lab/client";
import { LABELS, LABEL_DISPLAY, starsToLabel, type Label, type SentimentResult } from "@/lib/lab/shared";
import { brierScore, ece, mean, percentile, reliabilityBins } from "@/lib/stats";
import { jevHint, type Health } from "./Lab";
import { ms } from "./SentimentCard";

type ModelRow = { res?: SentimentResult; ms?: number; error?: string; tokens?: number; cost?: number };
type Row = LabItem & { bert: ModelRow; jev: ModelRow };

const BUILT_IN: LabItem[] = LAB_SAMPLES.map((s) => ({ text: s.text, truth: starsToLabel(s.stars), tag: s.tag }));

export function BenchmarkTab({ health }: { health: Health | null }) {
  const [items, setItems] = useState<LabItem[]>(BUILT_IN);
  const [source, setSource] = useState("Built-in set (32 hand-labelled reviews)");
  const [useBert, setUseBert] = useState(true);
  const [useJev, setUseJev] = useState(true);
  const [concurrency, setConcurrency] = useState(4);
  const [rows, setRows] = useState<Row[]>([]);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [filter, setFilter] = useState<"all" | "disagree" | "wrong">("all");
  const [firstError, setFirstError] = useState<{ msg: string; code?: string } | null>(null);
  const ctrl = useRef<AbortController | null>(null);
  const { fmt } = useCurrency();
  const jevRowCap = health?.quota && !health.quota.unlimited ? health.quota.maxCallsPerTry : Infinity;

  const onFile = async (f: File) => {
    try {
      const { items, textCol, labelCol } = csvToItems(await f.text());
      if (!items.length) throw new Error("No non-empty rows found.");
      setItems(items);
      setSource(`${f.name}: ${items.length} rows · text=“${textCol}”${labelCol ? ` · label=“${labelCol}”` : " · no labels (accuracy hidden)"}`);
      setRows([]);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const run = async () => {
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setRunning(true);
    setFirstError(null);
    setProgress(0);
    const init: Row[] = items.map((it) => ({ ...it, bert: {}, jev: {} }));
    setRows(init);
    let done = 0;
    let jevFatal = false; // e.g. missing key / card required / quota: don't hammer the provider for every row
    const runId = newRunId(); // the whole benchmark run counts as ONE try
    const jevCap = jevRowCap;
    await pool(
      items,
      concurrency,
      async (it, i) => {
        const [b, j] = await Promise.allSettled([
          useBert ? callBert(it.text, c.signal) : Promise.reject(new LabError("skipped", 0)),
          useJev && !jevFatal && i < jevCap ? callJev(it.text, runId, c.signal) : Promise.reject(new LabError("skipped", 0)),
        ]);
        const row: Row = { ...it, bert: {}, jev: {} };
        if (b.status === "fulfilled") row.bert = { res: b.value.data, ms: b.value.client_ms };
        else row.bert = { error: (b.reason as Error).message };
        if (j.status === "fulfilled")
          row.jev = {
            res: j.value.data,
            ms: j.value.client_ms,
            tokens: j.value.data.usage.input_tokens,
            cost: j.value.data.cost_usd ?? (j.value.data.usage.input_tokens * 0.042) / 1e6,
          };
        else {
          row.jev = { error: (j.reason as Error).message };
          const r = j.reason as LabError;
          if (useJev && r.status !== 0) setFirstError((e) => e ?? { msg: r.message, code: r.code });
          if ([400, 401, 402, 403, 429, 500, 503].includes(r.status)) jevFatal = true;
        }
        setRows((rs) => rs.map((x, k) => (k === i ? row : x)));
        setProgress(++done);
      },
      c.signal,
    );
    setRunning(false);
  };

  const hasTruth = rows.some((r) => r.truth);
  const metrics = useMemo(() => {
    const m = (key: "bert" | "jev") => {
      const ok = rows.filter((r) => r[key].res);
      const withTruth = ok.filter((r) => r.truth);
      const correct = withTruth.filter((r) => r[key].res!.label === r.truth);
      const within1 = withTruth.filter((r) => Math.abs(labelIndex(r[key].res!.label) - labelIndex(r.truth!)) <= 1);
      const lat = ok.map((r) => r[key].ms!);
      const calib = withTruth.map((r) => ({ confidence: r[key].res!.confidence, correct: r[key].res!.label === r.truth }));
      const bins = reliabilityBins(calib, 5);
      return {
        n: ok.length,
        errors: rows.filter((r) => r[key].error && r[key].error !== "skipped").length,
        acc: withTruth.length ? correct.length / withTruth.length : NaN,
        within1: withTruth.length ? within1.length / withTruth.length : NaN,
        p50: percentile(lat, 0.5),
        p95: percentile(lat, 0.95),
        meanConf: mean(ok.map((r) => r[key].res!.confidence)),
        brier: withTruth.length
          ? brierScore(withTruth.map((r) => ({ probs: LABELS.map((l) => r[key].res!.probabilities[l] ?? 0), truth: labelIndex(r.truth!) })))
          : NaN,
        ece: ece(bins),
        bins,
        lat,
        cost: ok.reduce((a, r) => a + (r[key].cost ?? 0), 0),
      };
    };
    return { bert: m("bert"), jev: m("jev") };
  }, [rows]);

  const tags = useMemo(() => {
    const t = new Map<string, { n: number; bert: number; jev: number }>();
    for (const r of rows) {
      if (!r.tag || !r.truth) continue;
      const e = t.get(r.tag) ?? { n: 0, bert: 0, jev: 0 };
      e.n++;
      if (r.bert.res?.label === r.truth) e.bert++;
      if (r.jev.res?.label === r.truth) e.jev++;
      t.set(r.tag, e);
    }
    return [...t.entries()];
  }, [rows]);

  const shown = rows.filter((r) => {
    if (filter === "disagree") return r.bert.res && r.jev.res && r.bert.res.label !== r.jev.res.label;
    if (filter === "wrong") return r.truth && ((r.bert.res && r.bert.res.label !== r.truth) || (r.jev.res && r.jev.res.label !== r.truth));
    return true;
  });

  const exportCsv = () => {
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const lines = [
      "text,truth,tag,bert_label,bert_conf,bert_ms,jev_label,jev_conf,jev_ms",
      ...rows.map((r) =>
        [esc(r.text), r.truth ?? "", r.tag ?? "", r.bert.res?.label ?? "", r.bert.res?.confidence ?? "", r.bert.ms ?? "", r.jev.res?.label ?? "", r.jev.res?.confidence ?? "", r.jev.ms ?? ""].join(","),
      ),
    ];
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "bert-vs-jev-results.csv" });
    a.click();
    URL.revokeObjectURL(url);
  };

  const pct = (v: number) => (Number.isNaN(v) ? "—" : `${(v * 100).toFixed(1)}%`);
  const finished = rows.length > 0 && !running;

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Dataset</p>
            <p className="mt-1 text-sm text-ink-2">{source}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setItems(BUILT_IN);
                  setSource("Built-in set (32 hand-labelled reviews)");
                  setRows([]);
                }}
              >
                Use built-in set
              </Button>
              <label className="inline-flex cursor-pointer items-center rounded-xl border border-line-2 bg-surface-2 px-4 py-2 text-sm hover:border-jev/60">
                Upload CSV…
                <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
              </label>
            </div>
            <p className="mt-2 text-xs text-ink-3">
              Same format as Moodify: a text column (review/text/comment…) plus an optional label column (1–5 stars or
              very_negative…very_positive). Max 200 rows.
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={useBert} onChange={(e) => setUseBert(e.target.checked)} /> BERT
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={useJev} onChange={(e) => setUseJev(e.target.checked)} /> JEV
            </label>
            <label className="flex items-center gap-2 text-ink-2">
              concurrency
              <select value={concurrency} onChange={(e) => setConcurrency(+e.target.value)} className="rounded-md border border-line bg-surface-2 px-2 py-1">
                {[1, 2, 4, 8].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <Button onClick={run} disabled={running || (!useBert && !useJev)} className="w-full">
              {running ? `Running ${progress}/${items.length}…` : `Run on ${items.length} reviews`}
            </Button>
            {running && (
              <button className="w-full text-xs text-ink-3 hover:text-ink" onClick={() => ctrl.current?.abort()}>
                stop
              </button>
            )}
          </div>
        </div>
        {rows.length > 0 && (
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-surface-3">
            <div className="h-full bg-jev transition-all" style={{ width: `${(progress / items.length) * 100}%` }} />
          </div>
        )}
        {useJev && items.length > jevRowCap && (
          <p className="mt-3 text-xs text-warn">
            One JEV try covers {jevRowCap} reviews, so JEV runs on the first {jevRowCap}. BERT runs on all {items.length}.
          </p>
        )}
        {health?.jev.id === "mock" && useJev && (
          <p className="mt-3 text-xs text-warn">JEV is in MOCK mode. Its numbers are placeholders until you add a key.</p>
        )}
        {firstError && (
          <div className="mt-3 rounded-xl border border-critical/40 bg-critical/5 p-3 text-sm">
            <p className="text-[#f08a8a]">JEV: {firstError.msg}</p>
            {jevHint(firstError.msg, firstError.code) && <p className="mt-1 text-ink-2">{jevHint(firstError.msg, firstError.code)}</p>}
          </div>
        )}
      </Card>

      {rows.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {(["bert", "jev"] as const).map((k) => {
              const m = metrics[k];
              const tone = k === "jev" ? "jev" : "llm";
              return (
                <Card key={k}>
                  <div className="flex items-center justify-between">
                    <p className={cn("font-medium", k === "jev" ? "text-jev-soft" : "text-llm-soft")}>{k === "jev" ? "JEV" : "BERT (Moodify)"}</p>
                    <span className="text-xs text-ink-3">
                      {m.n} ok{m.errors ? ` · ${m.errors} errors` : ""}
                    </span>
                  </div>
                  {m.n === 0 ? (
                    <p className="mt-6 text-sm text-ink-3">No successful calls{m.errors ? `: ${m.errors} failed` : ""}. Check the status bar and Setup tab.</p>
                  ) : (
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <Stat label="Exact accuracy" value={hasTruth ? pct(m.acc) : "n/a"} tone={tone} />
                    <Stat label="Within ±1 star" value={hasTruth ? pct(m.within1) : "n/a"} />
                    <Stat label="p50 latency" value={ms(m.p50)} />
                    <Stat label="p95 latency" value={ms(m.p95)} />
                    <Stat label="Brier ↓ / ECE ↓" value={hasTruth ? `${m.brier.toFixed(2)} / ${m.ece.toFixed(2)}` : "n/a"} sub="lower = better calibrated" />
                    <Stat label="API cost" value={k === "jev" ? fmt(m.cost, { digits: 5 }) : fmt(0)} sub={k === "jev" ? `mean conf ${m.meanConf.toFixed(2)}` : `self-hosted · mean conf ${m.meanConf.toFixed(2)}`} />
                  </div>
                  )}
                </Card>
              );
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Card>
              <p className="font-medium">Latency distribution (browser round trip)</p>
              <p className="mb-3 mt-1 text-xs text-ink-3">Each dot is one review. Ticks mark p50 and p95.</p>
              <LatencyStrip
                series={[
                  ...(useBert ? [{ name: "BERT", color: "var(--color-bert)", values: metrics.bert.lat }] : []),
                  ...(useJev ? [{ name: "JEV", color: "var(--color-jev)", values: metrics.jev.lat }] : []),
                ]}
              />
            </Card>
            <Card>
              <p className="font-medium">Calibration</p>
              <p className="mb-3 mt-1 text-xs text-ink-3">Does “0.9 confident” mean right 90% of the time?</p>
              {hasTruth ? (
                <Reliability
                  series={[
                    ...(useBert ? [{ name: "BERT", color: "var(--color-bert)", bins: metrics.bert.bins }] : []),
                    ...(useJev ? [{ name: "JEV", color: "var(--color-jev)", bins: metrics.jev.bins }] : []),
                  ]}
                />
              ) : (
                <p className="text-sm text-ink-3">Needs labelled data.</p>
              )}
            </Card>
          </div>

          {tags.length > 0 && (
            <Card>
              <p className="font-medium">Accuracy by review type</p>
              <p className="mt-1 text-xs text-ink-3">Where does each model break? Sarcasm and romanised Hinglish are the interesting rows.</p>
              <div className="mt-4 space-y-2.5">
                {tags.map(([tag, t]) => (
                  <div key={tag} className="grid grid-cols-[6rem_1fr] items-center gap-3 text-sm">
                    <span className="text-ink-2">
                      {tag} <span className="text-xs text-ink-3">n={t.n}</span>
                    </span>
                    <div className="space-y-1">
                      {(["bert", "jev"] as const).filter((k) => metrics[k].n > 0).map((k) => (
                        <div key={k} className="grid grid-cols-[1fr_3.5rem] items-center gap-2">
                          <div className="h-2.5 rounded-r bg-surface-3">
                            <div className={cn("h-full rounded-r", k === "jev" ? "bg-jev" : "bg-bert")} style={{ width: `${(t[k] / t.n) * 100}%` }} />
                          </div>
                          <span className="font-mono text-xs text-ink-2">
                            {k === "jev" ? "JEV" : "BERT"} {Math.round((t[k] / t.n) * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-0 sm:p-0">
            <div className="flex flex-wrap items-center gap-2 p-4">
              <p className="mr-auto font-medium">Per-review results</p>
              {(["all", "disagree", "wrong"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn("rounded-full border px-3 py-1 text-xs", filter === f ? "border-jev bg-jev/15" : "border-line text-ink-2")}
                >
                  {f === "all" ? "All" : f === "disagree" ? "Disagreements" : "Errors vs label"}
                </button>
              ))}
              <Button variant="outline" onClick={exportCsv} disabled={!finished}>
                Export CSV
              </Button>
            </div>
            <div className="max-h-[28rem] overflow-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="sticky top-0 bg-surface-2 text-left text-xs text-ink-3">
                  <tr>
                    <th className="px-4 py-2 font-medium">Review</th>
                    <th className="px-3 py-2 font-medium">Label</th>
                    <th className="px-3 py-2 font-medium text-llm-soft">BERT</th>
                    <th className="px-3 py-2 font-medium text-jev-soft">JEV</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((r, i) => (
                    <tr key={i} className="border-t border-line align-top">
                      <td className="max-w-md px-4 py-2 text-ink-2">
                        {r.text}
                        {r.tag && <Pill className="ml-2">{r.tag}</Pill>}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs">{r.truth ? LABEL_DISPLAY[r.truth] : "—"}</td>
                      <Cell m={r.bert} truth={r.truth} />
                      <Cell m={r.jev} truth={r.truth} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function Cell({ m, truth }: { m: ModelRow; truth?: Label }) {
  if (m.error) return <td className="px-3 py-2 text-xs text-ink-3">{m.error === "skipped" ? "—" : "error"}</td>;
  if (!m.res) return <td className="px-3 py-2 text-xs text-ink-3">…</td>;
  const right = truth ? m.res.label === truth : undefined;
  return (
    <td className="whitespace-nowrap px-3 py-2 text-xs">
      <span className={cn(right === true && "text-[#5fd35f]", right === false && "text-[#f08a8a]")}>
        {right === true ? "✓ " : right === false ? "✗ " : ""}
        {LABEL_DISPLAY[m.res.label]}
      </span>
      <span className="block font-mono text-ink-3">
        {m.res.confidence.toFixed(2)} · {ms(m.ms)}
      </span>
    </td>
  );
}
