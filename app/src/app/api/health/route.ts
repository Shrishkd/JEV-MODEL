import { bertBackend, BERT_MODEL_ID } from "@/lib/bert";
import { resolveProvider } from "@/lib/jev/provider";
import { peekQuota } from "@/lib/quota";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const jev = resolveProvider();
  const backend = bertBackend();

  let bert: Record<string, unknown>;
  if (backend.kind === "service") {
    try {
      const res = await fetch(`${backend.url}/health`, { signal: AbortSignal.timeout(2000), cache: "no-store" });
      bert = { ...(await res.json()), mode: "service", device: "local (bert-service)" };
    } catch {
      bert = { ok: false, mode: "service", error: `BERT service not reachable at ${backend.url}` };
    }
  } else if (backend.kind === "hf") {
    // Not pinged on purpose: every HF call spends inference credits.
    bert = { ok: true, mode: "hf", model: BERT_MODEL_ID, device: "Hugging Face Inference API" };
  } else {
    bert = { ok: false, mode: "none", error: "Set BERT_SERVICE_URL or HF_TOKEN" };
  }

  const q = await peekQuota(req).catch(() => null);
  const quota =
    q &&
    (q.unlimited
      ? { unlimited: true }
      : { unlimited: false, limit: q.limit, remaining: q.storeMissing ? 0 : q.remaining, maxCallsPerTry: q.maxCallsPerTry, storeMissing: q.storeMissing });

  return Response.json({ jev, bert, quota: jev.id === "mock" ? { unlimited: true } : quota });
}
