# JEV Explained + BERT vs JEV Lab

An interactive, dark-mode guide to **JEV by TypeSafe AI**, a System-1 decision model. It comes with a hands-on lab that compares it with the BERT model from **Moodify**.

| Route  | What it is | Calls real APIs? |
|--------|------------|------------------|
| `/`    | The explainer: what JEV is, System 1 vs 2, origin, API, JEV vs LLM (speed race, ₹/$ cost calculator, format-drift demo), calibration & RLCD, speculative architecture, the Flipkart-style aspect demo from the video, use-case gallery, limitations, evidence, video notes and a quiz | **No.** Every demo is a local simulation (`src/lib/sim/pseudoJev.ts`) and is labelled "simulated". |
| `/lab` | Moodify 2.0: head-to-head race, labelled benchmark (accuracy, ±1-star accuracy, p50/p95 latency, Brier/ECE calibration, cost, per-category accuracy, CSV upload/export) and per-aspect analysis that BERT can't do | **Yes.** It uses the JEV API and the local BERT service. |

## Run it

```bash
npm install
cp .env.example .env.local        # add your key(s), see below
npm run dev                       # http://localhost:3000

# BERT side of the lab (second terminal)
cd bert-service
pip install -r requirements.txt
uvicorn main:app --port 8000
```

## JEV provider: switching needs no code change

`src/lib/jev/provider.ts` speaks TypeSafe's native `/v1/systemone` format to all backends:

| Provider | Env var | Endpoint | Model |
|---|---|---|---|
| Vercel AI Gateway | `AI_GATEWAY_API_KEY` | `https://ai-gateway.vercel.sh/typesafe/v1/systemone` | `typesafe-ai/jev` |
| TypeSafe direct | `TYPESAFE_API_KEY` | `https://api.typesafe.ai/v1/systemone` | `jev-latest` |
| Mock (no key) | none | local imitation, clearly flagged in the UI | `pseudo-jev (mock)` |

With `JEV_PROVIDER=auto` (the default), the TypeSafe key wins if it's set, then the Vercel key, then mock. **When you get a TypeSafe key, paste it into `TYPESAFE_API_KEY` and restart.** Nothing else changes.

> Vercel AI Gateway returns `customer_verification_required` (403) until a credit card is on the Vercel account. Adding one also unlocks free credits. The lab shows this hint inline.

## BERT service

`bert-service/main.py` is a FastAPI wrapper around the same model Moodify uses (`nlptown/bert-base-multilingual-uncased-sentiment`, 5 classes). It adds per-request `tokenize_ms` / `inference_ms` timings. Set `BERT_MODEL_PATH` to load Moodify's local copy (`../Moodify-WebApp/Backend/model`) instead of the Hugging Face cache.

## Deploying

- The Next.js app deploys to Vercel as-is. Set the env vars in the project settings, not in code.
- The BERT service (about 670 MB of weights plus torch) doesn't fit on Vercel functions. Host it on Hugging Face Spaces, Render or Railway, and point `BERT_SERVICE_URL` at it.
- `/api/jev` has a per-IP rate limit (`LAB_RATE_LIMIT_PER_MIN`). Keep it if the lab is public, or add auth.

## Project layout

```
src/app/page.tsx              blog (static)
src/app/lab/page.tsx          lab
src/app/api/{jev,bert,health} server routes (keys never reach the browser)
src/components/blog/*         one file per blog section
src/components/lab/*          lab tabs
src/components/charts/*       reliability diagram, latency strip
src/lib/jev/*                 provider switch + TypeSafe types
src/lib/sim/pseudoJev.ts      simulator used by the blog
src/lib/data/*                use cases, demo reviews, labelled lab set
bert-service/                 FastAPI BERT service
```

Facts are current as of 24 Sept 2026. Sources are listed in the site footer.
