import { resolveProvider } from "@/lib/jev/provider";

export const dynamic = "force-dynamic";

export async function GET() {
  const jev = resolveProvider();
  const bertUrl = process.env.BERT_SERVICE_URL ?? "http://127.0.0.1:8000";
  let bert: Record<string, unknown>;
  try {
    const res = await fetch(`${bertUrl}/health`, { signal: AbortSignal.timeout(2000), cache: "no-store" });
    bert = await res.json();
  } catch {
    bert = { ok: false, error: `BERT service not reachable at ${bertUrl}` };
  }
  return Response.json({ jev, bert });
}
