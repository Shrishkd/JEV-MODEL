"use client";

import type { AspectResult, BertSentimentResponse, JevSentimentResponse } from "./shared";
import { starsToLabel, type Label, LABELS } from "./shared";

export type Timed<T> = { data: T; client_ms: number };
export class LabError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}

async function post<T>(url: string, body: unknown, signal?: AbortSignal): Promise<Timed<T>> {
  const t0 = performance.now();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const client_ms = Math.round(performance.now() - t0);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new LabError(data?.error ?? `Request failed (${res.status})`, res.status, data?.code);
  return { data: data as T, client_ms };
}

export const callJev = (text: string, signal?: AbortSignal) => post<JevSentimentResponse>("/api/jev", { text, mode: "sentiment" }, signal);
export const callBert = (text: string, signal?: AbortSignal) => post<BertSentimentResponse>("/api/bert", { text }, signal);
export const callJevAspects = (text: string, aspects: string[], signal?: AbortSignal) =>
  post<{ provider: string; model: string; upstream_ms: number; questions: number; aspects: AspectResult[]; usage: { input_tokens: number } }>(
    "/api/jev",
    { text, mode: "aspects", aspects },
    signal,
  );

/** Run `fn` over items with at most `limit` in flight. */
export async function pool<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>, signal?: AbortSignal) {
  const out: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length && !signal?.aborted) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

// ---------------- CSV ----------------

/** RFC-4180-ish parser (quotes, escaped quotes, commas and newlines inside quotes). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

const TEXT_COLS = ["review", "reviews", "text", "content", "comment", "message", "review_text", "body"];
const LABEL_COLS = ["label", "rating", "stars", "star", "sentiment", "score"];

const NAMED: Record<string, Label> = {
  "very negative": "very_negative",
  very_negative: "very_negative",
  negative: "negative",
  neutral: "neutral",
  positive: "positive",
  "very positive": "very_positive",
  very_positive: "very_positive",
};

export type LabItem = { text: string; truth?: Label; tag?: string };

/** Moodify-style column detection: known text column names, else column 2; optional label column. */
export function csvToItems(csv: string, max = 200): { items: LabItem[]; textCol: string; labelCol?: string } {
  const rows = parseCsv(csv);
  if (rows.length < 2) throw new Error("CSV needs a header row and at least one data row.");
  const header = rows[0].map((h) => h.trim().toLowerCase());
  let ti = header.findIndex((h) => TEXT_COLS.includes(h));
  if (ti < 0) ti = header.length > 1 ? 1 : 0;
  const li = header.findIndex((h, i) => i !== ti && LABEL_COLS.includes(h));
  const items: LabItem[] = [];
  for (const r of rows.slice(1)) {
    const text = (r[ti] ?? "").trim();
    if (!text) continue;
    let truth: Label | undefined;
    if (li >= 0) {
      const raw = (r[li] ?? "").trim().toLowerCase();
      const n = Number.parseFloat(raw);
      if (Number.isFinite(n) && n >= 1 && n <= 5) truth = starsToLabel(n);
      else if (NAMED[raw]) truth = NAMED[raw];
    }
    items.push({ text: text.slice(0, 4000), truth });
    if (items.length >= max) break;
  }
  return { items, textCol: header[ti], labelCol: li >= 0 ? header[li] : undefined };
}

export const labelIndex = (l: Label) => LABELS.indexOf(l);
