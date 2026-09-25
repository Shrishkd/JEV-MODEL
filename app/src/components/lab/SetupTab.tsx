"use client";

import { Button, Card, CodeBlock, Pill } from "@/components/ui";
import type { Health } from "./Lab";

export function SetupTab({ health, onRefresh }: { health: Health | null; onRefresh: () => void }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">1 · JEV provider</h3>
          {health && (
            <Pill tone={health.jev.id === "mock" ? "warn" : health.jev.configured ? "jev" : "critical"}>
              {health.jev.id} · {health.jev.model}
            </Pill>
          )}
        </div>
        <p className="mt-2 text-sm text-ink-2">
          The server picks a provider automatically (<code className="font-mono">JEV_PROVIDER=auto</code>): a TypeSafe key if present,
          else the Vercel AI Gateway key, else a clearly-labelled mock. Both real providers use TypeSafe&apos;s exact{" "}
          <code className="font-mono">/v1/systemone</code> request format, so switching providers needs no code change.
        </p>
        <CodeBlock
          className="mt-4"
          lang=".env.local"
          code={`# Today: Vercel AI Gateway
AI_GATEWAY_API_KEY=vck_...

# Later: paste your TypeSafe key. It wins automatically.
TYPESAFE_API_KEY=ts_...

# Optional: force one (typesafe | vercel | mock)
JEV_PROVIDER=auto`}
        />
        <ul className="mt-4 space-y-1.5 text-sm text-ink-2">
          <li>• Restart <code className="font-mono">npm run dev</code> after editing .env.local.</li>
          <li>
            • Vercel AI Gateway returns <code className="font-mono">customer_verification_required</code> until a card is on the
            account. Adding one also unlocks free credits.
          </li>
          <li>• Keys stay on the server. The browser only talks to /api/jev.</li>
        </ul>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">2 · BERT service</h3>
          {health && <Pill tone={health.bert.ok ? "good" : "critical"}>{health.bert.ok ? `online · ${health.bert.device}` : "offline"}</Pill>}
        </div>
        <p className="mt-2 text-sm text-ink-2">
          A small FastAPI wrapper around Moodify&apos;s model (<code className="font-mono">nlptown/bert-base-multilingual-uncased-sentiment</code>)
          that also reports tokenize and forward-pass timings.
        </p>
        <CodeBlock
          className="mt-4"
          lang="terminal"
          code={`cd bert-service
pip install -r requirements.txt
uvicorn main:app --port 8000

# optional: load the copy already inside Moodify instead of the HF cache
# set BERT_MODEL_PATH=D:\\PROJECTS\\Moodify-WebApp\\Backend\\model`}
        />
        {health?.bert.ok && (
          <p className="mt-3 text-xs text-ink-3">
            Loaded <span className="font-mono">{health.bert.model}</span> in {health.bert.load_seconds}s.
          </p>
        )}
        {!health?.bert.ok && health?.bert.error && <p className="mt-3 text-xs text-[#f08a8a]">{health.bert.error}</p>}
        <Button variant="outline" className="mt-4" onClick={onRefresh}>
          ↻ Recheck both
        </Button>
      </Card>

      <Card className="lg:col-span-2">
        <h3 className="font-semibold">How to read a fair comparison</h3>
        <div className="mt-3 grid gap-4 text-sm text-ink-2 md:grid-cols-3">
          <p>
            <b className="text-ink">Latency.</b> “Browser round trip” includes your network and our API route. For BERT, “forward pass”
            is pure model time on your CPU/GPU. JEV&apos;s model time isn&apos;t exposed, so “server → JEV” includes internet latency to
            the provider.
          </p>
          <p>
            <b className="text-ink">Accuracy.</b> Both models answer the same 5-class question. BERT learned it from Amazon-style star
            ratings. JEV gets only the English descriptions of each class. “Within ±1 star” forgives neighbouring-class confusion.
          </p>
          <p>
            <b className="text-ink">Calibration.</b> Lower Brier/ECE means the confidence number is more trustworthy for thresholds.
            32 reviews is a small sample, so upload a few hundred labelled rows for conclusions you can defend.
          </p>
        </div>
      </Card>
    </div>
  );
}
