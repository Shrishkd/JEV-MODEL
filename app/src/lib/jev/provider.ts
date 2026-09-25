import { simulateChoice, simulateSentiment, sampleJevLatency, mulberry32, hashString } from "@/lib/sim/pseudoJev";
import type { JevQuestions, JevResponse, ProviderId, ProviderInfo } from "./types";

/**
 * One client, three backends. All speak TypeSafe's native /v1/systemone shape:
 *   typesafe → https://api.typesafe.ai/v1/systemone            (TYPESAFE_API_KEY, model jev-latest)
 *   vercel   → https://ai-gateway.vercel.sh/typesafe/v1/systemone (AI_GATEWAY_API_KEY, model typesafe-ai/jev)
 *   mock     → local imitation, for building UI without a key (clearly labelled in the UI)
 *
 * JEV_PROVIDER=auto (default) picks typesafe if its key exists, else vercel, else mock.
 * So when your TypeSafe key arrives, adding TYPESAFE_API_KEY is the only change.
 */

const ENDPOINTS: Record<Exclude<ProviderId, "mock">, { url: string; model: string; keyVar: string }> = {
  typesafe: {
    url: process.env.TYPESAFE_BASE_URL ?? "https://api.typesafe.ai/v1/systemone",
    model: process.env.TYPESAFE_MODEL ?? "jev-latest",
    keyVar: "TYPESAFE_API_KEY",
  },
  vercel: {
    url: process.env.AI_GATEWAY_TYPESAFE_URL ?? "https://ai-gateway.vercel.sh/typesafe/v1/systemone",
    model: process.env.AI_GATEWAY_JEV_MODEL ?? "typesafe-ai/jev",
    keyVar: "AI_GATEWAY_API_KEY",
  },
};

export function resolveProvider(): ProviderInfo {
  const pref = (process.env.JEV_PROVIDER ?? "auto").toLowerCase();
  const has = (v: string) => Boolean(process.env[v]?.trim());

  const pick = (id: ProviderId): ProviderInfo =>
    id === "mock"
      ? { id, model: "pseudo-jev (mock)", configured: true }
      : { id, model: ENDPOINTS[id].model, configured: has(ENDPOINTS[id].keyVar) };

  if (pref === "typesafe" || pref === "vercel" || pref === "mock") return pick(pref);
  if (has("TYPESAFE_API_KEY")) return pick("typesafe");
  if (has("AI_GATEWAY_API_KEY")) return pick("vercel");
  return pick("mock");
}

export class JevError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}

export async function systemOne(state: string, questions: JevQuestions, signal?: AbortSignal): Promise<JevResponse> {
  const provider = resolveProvider();
  const t0 = performance.now();

  if (provider.id === "mock") {
    const answers = mockAnswers(state, questions);
    await new Promise((r) => setTimeout(r, sampleJevLatency(mulberry32(hashString(state)))));
    return {
      model: provider.model,
      answers,
      usage: { input_tokens: Math.ceil(state.length / 4) + 60 * Object.keys(questions).length, output_tokens: 0 },
      provider: provider.id,
      latency_ms: Math.round(performance.now() - t0),
    };
  }

  const ep = ENDPOINTS[provider.id];
  const key = process.env[ep.keyVar]?.trim();
  if (!key) throw new JevError(`${ep.keyVar} is not set`, 500, "missing_key");
  // Never send a Vercel credential to TypeSafe (or anything else to the wrong provider).
  if (provider.id === "typesafe" && /^vc[kp]_/.test(key))
    throw new JevError("TYPESAFE_API_KEY contains a Vercel key. Put vck_… in AI_GATEWAY_API_KEY and never use vcp_ tokens here.", 500, "missing_key");

  const res = await fetch(ep.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: ep.model, state, questions }),
    signal,
    cache: "no-store",
  });
  const latency_ms = Math.round(performance.now() - t0);
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Gateway errors: { error: { message, type } }; TypeSafe errors: { message, error_type }.
    const message = body?.error?.message ?? body?.message ?? `JEV request failed (${res.status})`;
    const code = body?.error?.type ?? body?.error_type;
    throw new JevError(message, res.status, code);
  }

  const cost = body?.provider_metadata?.gateway?.cost;
  return {
    model: body.model ?? ep.model,
    answers: body.answers,
    usage: body.usage ?? { input_tokens: 0, output_tokens: 0 },
    provider: provider.id,
    latency_ms,
    cost_usd: cost !== undefined ? Number(cost) : undefined,
  };
}

function mockAnswers(state: string, questions: JevQuestions): JevResponse["answers"] {
  const out: JevResponse["answers"] = {};
  const senti = simulateSentiment(state);
  for (const [name, q] of Object.entries(questions)) {
    if (q.type === "choice") {
      const keys = Object.keys(q.criteria);
      if (keys.join() === "very_negative,negative,neutral,positive,very_positive") {
        out[name] = { type: "choice", choice: senti.label, confidence: senti.confidence, probabilities: senti.probabilities };
      } else {
        out[name] = simulateChoice(
          state,
          keys.map((k) => ({ key: k, label: `${k} ${q.criteria[k]}` })),
        );
      }
    } else if (q.type === "score") {
      // Aspect-level satisfaction: sentiment of the sentences that mention the aspect.
      const topic = (q.instructions.match(/with the ([a-z ]+?)[?.]/i)?.[1] ?? "").split(" ")[0];
      const sentences = state.split(/(?<=[.!?])\s+/).filter((s) => !topic || s.toLowerCase().includes(topic));
      const s = simulateSentiment(sentences.join(" ") || state);
      const n = q.criteria.length;
      const pos = ((s.score - 1) / 4) * (n - 1);
      const probs = q.criteria.map((_, i) => Math.exp(-((i - pos) ** 2) / 0.5));
      const z = probs.reduce((a, b) => a + b, 0);
      const p = probs.map((x) => x / z);
      const probabilities = Object.fromEntries(p.map((v, i) => [String(i), Math.round(v * 100) / 100]));
      out[name] = {
        type: "score",
        score: Math.round(p.reduce((a, v, i) => a + v * i, 0) * 100) / 100,
        confidence: Math.round(Math.max(...p) * 100) / 100,
        probabilities,
      };
    } else {
      const topic = q.instructions.toLowerCase().match(/about (?:the )?([a-z]+)/)?.[1];
      const hit = topic ? state.toLowerCase().includes(topic) : false;
      out[name] = { type: "noul", noul: hit ? 0.93 : 0.06 };
    }
  }
  return out;
}
