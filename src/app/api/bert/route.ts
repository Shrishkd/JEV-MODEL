import { MAX_TEXT, type BertSentimentResponse } from "@/lib/lab/shared";
import { rateLimit, tooMany } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const BERT_URL = process.env.BERT_SERVICE_URL ?? "http://127.0.0.1:8000";

export async function POST(req: Request) {
  if (!rateLimit(req, 600)) return tooMany(); // local model: generous limit

  const body = (await req.json().catch(() => ({}))) as { text?: unknown };
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return Response.json({ error: "text is required" }, { status: 400 });
  if (text.length > MAX_TEXT) return Response.json({ error: `text must be ≤ ${MAX_TEXT} characters` }, { status: 400 });

  const t0 = performance.now();
  try {
    const [pred, health] = await Promise.all([
      fetch(`${BERT_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: AbortSignal.any([req.signal, AbortSignal.timeout(30_000)]),
        cache: "no-store",
      }),
      getHealth(),
    ]);
    const upstream_ms = Math.round(performance.now() - t0);
    const data = await pred.json();
    if (!pred.ok) return Response.json({ error: data?.detail ?? "BERT error" }, { status: pred.status });
    const out: BertSentimentResponse = { ...data, model: health.model, device: health.device, upstream_ms };
    return Response.json(out);
  } catch {
    return Response.json(
      { error: `BERT service not reachable at ${BERT_URL}. Start it with: cd bert-service && uvicorn main:app --port 8000` },
      { status: 503 },
    );
  }
}

// Cache the (static) model info so we don't add a second round trip per request.
let healthCache: { model: string; device: string } | null = null;
async function getHealth() {
  if (healthCache) return healthCache;
  const h = await fetch(`${BERT_URL}/health`, { cache: "no-store" }).then((r) => r.json());
  healthCache = { model: h.model, device: h.device };
  return healthCache;
}
