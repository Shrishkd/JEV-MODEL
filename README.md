# JEV: explainer blog + sentiment app

```
JEV/
├── blog/            Next.js · JEV explainer (static, simulated demos, no keys)        → Vercel project #1
├── app/             Next.js · Moodify 2.0: BERT vs JEV compare (+ JEV analyser next)  → Vercel project #2
├── bert-service/    FastAPI · Moodify's BERT model, for local development
├── render.yaml      optional: host bert-service on Render (paid 2 GB plan)
└── README.md
```

## How the parts talk to each other

```
 blog (static) ──link──▶ app /compare          browser only ever calls the app's own /api/*
                           ├─ /api/jev    ──▶ JEV via Vercel AI Gateway (TypeSafe direct later)
                           │                 └─ quota: 3 tries / visitor / day
                           ├─ /api/bert   ──▶ local:      bert-service (BERT_SERVICE_URL)
                           │                 production: Hugging Face Inference API (HF_TOKEN)
                           └─ /api/health ──▶ status of both + tries left
```

- **blog** has no server code and no secrets. Its lab links use `NEXT_PUBLIC_APP_URL`.
- **app** keeps all keys server-side. `/` redirects to `/compare` for now and will become the JEV sentiment analyser.
- **BERT** is the same model as Moodify (`nlptown/bert-base-multilingual-uncased-sentiment`). Locally it runs in
  `bert-service`. In production, Hugging Face serves that exact model, so there's nothing to host.

## Run locally

```bash
cd bert-service && pip install -r requirements.txt && uvicorn main:app --port 8000
cd blog && npm install && npm run dev        # http://localhost:3000
cd app  && npm install && npm run dev        # http://localhost:3001   (cp .env.example .env.local)
```

## Rate limiting: one strategy, enforced on the server

Daily quotas are stored in **Upstash Redis** and keyed by the visitor's IP (Vercel's `x-real-ip`), with a site-wide daily
ceiling on top. There's no other limiter.

| Env var | Default | Meaning |
|---|---|---|
| `JEV_TRIES_PER_DAY` | `3` | Tries per visitor per UTC day. One try = one race, aspects run, or whole benchmark run. `0` = unlimited. |
| `JEV_MAX_CALLS_PER_TRY` | `40` | JEV calls inside one try (a benchmark covers up to 40 reviews). |
| `JEV_GLOBAL_DAILY_CALLS` | `500` | Site-wide JEV ceiling: the number that bounds your bill (~₹1/day). |
| `BERT_CALLS_PER_DAY` | `200` | Hosted BERT (HF credits) per visitor. The local `bert-service` is never limited. |
| `BERT_GLOBAL_DAILY_CALLS` | `2000` | Site-wide hosted-BERT ceiling. |

- If JEV fails on a try's first call (outage, bad key), the try is **refunded**.
- **Fails closed:** on Vercel without Redis, JEV and hosted BERT return `503 store_missing` instead of running unlimited.
  Locally, counts live in memory and no Redis is needed.
- The mock provider and the local BERT service are free, so they're never counted.

## Deploying (everything free except JEV usage)

### 1. BERT → Hugging Face Inference API (no hosting)
1. huggingface.co → Settings → **Access Tokens** → *Create new token* → type **Fine-grained** → tick
   **"Make calls to Inference Providers"** → copy `hf_…`.
2. That's all. This token is the app's `HF_TOKEN` in step 2. Free accounts get monthly inference credits, and a
   BERT-base classification uses very little of them.

(To self-host instead: `render.yaml` deploys `bert-service` on Render's **Standard** plan. BERT-base needs ~1 GB RAM, and
Render's 512 MB Free/Starter plans run out of memory. Then set `BERT_SERVICE_URL` instead of `HF_TOKEN`.)

### 2. App → Vercel project #2
1. vercel.com → **Add New → Project** → import the GitHub repo → **Root Directory: `app`**.
2. Environment variables:
   - `AI_GATEWAY_API_KEY` = `vck_…`
   - `HF_TOKEN` = `hf_…`. Do **not** set `BERT_SERVICE_URL` (a `localhost` value is ignored on Vercel anyway).
   - Optional overrides of the limits above (the defaults are sensible).
3. **Required: Storage → Upstash for Redis → Create (free plan) → connect to this project.** It adds
   `KV_REST_API_URL` / `KV_REST_API_TOKEN`, which the quota picks up automatically. Without it, JEV and BERT refuse calls.
4. **Deploy** (or Redeploy), then open `/compare`. The status bar should show *JEV · Vercel AI Gateway*,
   *BERT · online (Hugging Face Inference API)* and *JEV tries left today: 3/3*.

### 3. Blog → Vercel project #1
1. **Add New → Project** → import the **same** repo → **Root Directory: `blog`**.
2. Environment variable: `NEXT_PUBLIC_APP_URL=https://<your-app>.vercel.app` → **Deploy**.

### 4. Link back
App project → Settings → Environment Variables → `NEXT_PUBLIC_BLOG_URL=https://<your-blog>.vercel.app` → **Redeploy**.
`NEXT_PUBLIC_*` values are baked in at build time, so a redeploy is required whenever they change.

### Keep the two deploys independent
In each Vercel project: **Settings → Git → Ignored Build Step** → `git diff --quiet HEAD^ HEAD -- .`
This skips the build when nothing in that folder changed.

## Keys: what goes where

| Key | Goes in | Never |
|---|---|---|
| `vck_…` Vercel **AI Gateway** key | app → `AI_GATEWAY_API_KEY` | in the blog, in git |
| TypeSafe key (when you get one) | app → `TYPESAFE_API_KEY` (it wins automatically) | anywhere else |
| `hf_…` Hugging Face token | app → `HF_TOKEN` | in the blog, in git |
| `vcp_…` Vercel **account** token | nowhere in this project (only the Vercel CLI uses it) | in any env var |

OpenRouter doesn't host JEV. It only serves chat models.
