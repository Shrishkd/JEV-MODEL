import { LABELS, MAX_TEXT, type BertSentimentResponse, type Label } from "@/lib/lab/shared";
import { bertBackend, BERT_MODEL_ID } from "@/lib/bert";
import { rateLimit, tooMany } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!rateLimit(req, 600)) return tooMany();

  const body = (await req.json().catch(() => ({}))) as { text?: unknown };
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return Response.json({ error: "text is required" }, { status: 400 });
  if (text.length > MAX_TEXT) return Response.json({ error: `text must be ≤ ${MAX_TEXT} characters` }, { status: 400 });

  const backend = bertBackend();
  if (backend.kind === "none")
    return Response.json(
      { error: "BERT isn't configured. Set BERT_SERVICE_URL (local bert-service) or HF_TOKEN (Hugging Face Inference API)." },
      { status: 503 },
    );

  const t0 = performance.now();
  try {
    return backend.kind === "service" ? await viaService(backend.url, text, req, t0) : await viaHuggingFace(backend.token, text, req, t0);
  } catch {
    return Response.json(
      {
        error:
          backend.kind === "service"
            ? `BERT service not reachable at ${backend.url}. Start it with: cd bert-service && uvicorn main:app --port 8000`
            : "Hugging Face Inference API unreachable.",
      },
      { status: 503 },
    );
  }
}

/** Local FastAPI service: returns real tokenize / forward-pass timings. */
async function viaService(url: string, text: string, req: Request, t0: number) {
  const pred = await fetch(`${url}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal: AbortSignal.any([req.signal, AbortSignal.timeout(30_000)]),
    cache: "no-store",
  });
  const upstream_ms = Math.round(performance.now() - t0);
  const data = await pred.json();
  if (!pred.ok) return Response.json({ error: data?.detail ?? "BERT error" }, { status: pred.status });
  const out: BertSentimentResponse = { ...data, model: BERT_MODEL_ID, device: "local (bert-service)", upstream_ms };
  return Response.json(out);
}

/** Hugging Face's hosted copy of the same model: no server to run. */
async function viaHuggingFace(token: string, text: string, req: Request, t0: number) {
  const res = await fetch(`https://router.huggingface.co/hf-inference/models/${BERT_MODEL_ID}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "x-wait-for-model": "true" },
    body: JSON.stringify({ inputs: text, parameters: { top_k: 5 } }),
    signal: AbortSignal.any([req.signal, AbortSignal.timeout(30_000)]),
    cache: "no-store",
  });
  const upstream_ms = Math.round(performance.now() - t0);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = typeof data?.error === "string" ? data.error : `Hugging Face error (${res.status})`;
    return Response.json({ error: res.status === 401 ? "HF_TOKEN was rejected by Hugging Face." : msg }, { status: res.status });
  }

  // Response: [{label: "5 stars", score}, ...] (sometimes nested one level deeper).
  const rows = (Array.isArray(data?.[0]) ? data[0] : data) as { label: string; score: number }[];
  const probabilities = Object.fromEntries(LABELS.map((l) => [l, 0])) as Record<Label, number>;
  for (const r of rows ?? []) {
    const stars = Number.parseInt(r.label, 10); // "1 star" … "5 stars"
    if (stars >= 1 && stars <= 5) probabilities[LABELS[stars - 1]] = Math.round(r.score * 10_000) / 10_000;
  }
  const best = LABELS.reduce((a, b) => (probabilities[b] > probabilities[a] ? b : a));
  const out: BertSentimentResponse = {
    label: best,
    stars: LABELS.indexOf(best) + 1,
    confidence: probabilities[best],
    probabilities,
    score: LABELS.reduce((acc, l, i) => acc + probabilities[l] * (i + 1), 0),
    model: BERT_MODEL_ID,
    device: "Hugging Face Inference API",
    upstream_ms,
    timings: null,
  };
  return Response.json(out);
}
