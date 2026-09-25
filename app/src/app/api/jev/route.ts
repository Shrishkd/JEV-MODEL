import { JevError, resolveProvider, systemOne } from "@/lib/jev/provider";
import { consumeJevCall, quotaHeaders, refundJevTry } from "@/lib/quota";
import type { ChoiceAnswer, NoulAnswer, ScoreAnswer } from "@/lib/jev/types";
import {
  LABELS,
  MAX_TEXT,
  aspectKey,
  aspectQuestions,
  sentimentQuestions,
  type AspectResult,
  type JevSentimentResponse,
  type Label,
} from "@/lib/lab/shared";

export const dynamic = "force-dynamic";

type Body = { text?: unknown; mode?: unknown; aspects?: unknown };

export async function POST(req: Request) {
  // 1) Validate first, so a bad request never spends a try.
  const body = (await req.json().catch(() => ({}))) as Body;
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return Response.json({ error: "text is required" }, { status: 400 });
  if (text.length > MAX_TEXT) return Response.json({ error: `text must be ≤ ${MAX_TEXT} characters` }, { status: 400 });

  const aspectsMode = body.mode === "aspects";
  const aspects = aspectsMode && Array.isArray(body.aspects)
    ? body.aspects.filter((a): a is string => typeof a === "string" && a.trim().length > 0 && a.length <= 40).slice(0, 10)
    : [];
  if (aspectsMode && !aspects.length) return Response.json({ error: "aspects must be a non-empty list" }, { status: 400 });

  // 2) Quota (real providers only; the mock costs nothing). Store errors fail closed.
  let headers: Record<string, string> = {};
  let refundable: string | null = null;
  if (resolveProvider().id !== "mock") {
    let verdict;
    try {
      verdict = await consumeJevCall(req, req.headers.get("x-jev-run"));
    } catch {
      return Response.json({ error: "Usage limits are temporarily unavailable, so JEV is paused.", code: "store_error" }, { status: 503 });
    }
    headers = quotaHeaders(verdict.status);
    if (!verdict.ok) return Response.json({ error: verdict.message, code: verdict.code }, { status: verdict.httpStatus, headers });
    if (verdict.newTry) refundable = verdict.runId;
  }

  // 3) Call JEV.
  try {
    if (aspectsMode) {
      const res = await systemOne(text, aspectQuestions(aspects), req.signal);
      const results: AspectResult[] = aspects.map((a) => {
        const k = aspectKey(a);
        const m = res.answers[`${k}__mentioned`] as NoulAnswer | undefined;
        const s = res.answers[`${k}__rating`] as ScoreAnswer | undefined;
        return {
          name: a,
          mentioned: m?.noul ?? 0,
          score: s ? s.score + 1 : null, // 0–4 rungs → 1–5 stars
          confidence: s?.confidence ?? (s ? Math.max(...Object.values(s.probabilities)) : null),
        };
      });
      return Response.json(
        {
          provider: res.provider,
          model: res.model,
          upstream_ms: res.latency_ms,
          usage: res.usage,
          cost_usd: res.cost_usd,
          questions: aspects.length * 2,
          aspects: results,
        },
        { headers },
      );
    }

    const res = await systemOne(text, sentimentQuestions(), req.signal);
    const a = res.answers.sentiment as ChoiceAnswer;
    const probabilities = Object.fromEntries(LABELS.map((l) => [l, a.probabilities[l] ?? 0])) as Record<Label, number>;
    const label = (LABELS.includes(a.choice as Label) ? a.choice : LABELS[0]) as Label;
    const out: JevSentimentResponse = {
      label,
      stars: LABELS.indexOf(label) + 1,
      confidence: a.confidence ?? probabilities[label],
      probabilities,
      score: LABELS.reduce((acc, l, i) => acc + probabilities[l] * (i + 1), 0),
      provider: res.provider,
      model: res.model,
      upstream_ms: res.latency_ms,
      usage: res.usage,
      cost_usd: res.cost_usd,
    };
    return Response.json(out, { headers });
  } catch (e) {
    // The provider failed on the call that opened this try: give the try back.
    if (refundable) headers = await refundJevTry(req, refundable).then(quotaHeaders, () => headers);
    if (e instanceof JevError) return Response.json({ error: e.message, code: e.code }, { status: e.status, headers });
    if ((e as Error).name === "AbortError") return Response.json({ error: "aborted" }, { status: 499, headers });
    return Response.json({ error: (e as Error).message ?? "JEV call failed" }, { status: 502, headers });
  }
}
