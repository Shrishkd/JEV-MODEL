# JEV: explainer blog + sentiment app

One repo, three deployable parts:

```
JEV/
├── blog/            Next.js · the JEV explainer (static, simulated demos, no keys)   → Vercel project #1
├── app/             Next.js · Moodify 2.0: JEV sentiment app + BERT vs JEV compare   → Vercel project #2
├── bert-service/    FastAPI · Moodify's BERT model behind an HTTP API                → Hugging Face Spaces (or Render)
├── render.yaml      Render blueprint for bert-service (paid 2 GB plan)
└── README.md
```

## How the parts talk to each other

```
        Browser
   ┌───────┴─────────────┐
   ▼                     ▼
 blog  ──link──▶  app  /compare ─────────────── (browser only talks to app's own /api/*)
 (static)          │
                   ├─ /api/jev    ──▶  JEV  (Vercel AI Gateway today, TypeSafe direct later)
                   ├─ /api/bert   ──▶  bert-service  /predict   (BERT_SERVICE_URL)
                   └─ /api/health ──▶  checks both
```

- **blog** has no server code and no secrets. Its "BERT vs JEV Lab" links go to `NEXT_PUBLIC_APP_URL/compare`.
- **app** keeps every key server-side. The browser only calls the app's own `/api/*` routes, and those call JEV and BERT.
  `/` currently redirects to `/compare`. It will become the JEV sentiment analyser.
- **bert-service** has no keys. The app reaches it over HTTPS through `BERT_SERVICE_URL`.

Shared UI files (`ui.tsx`, `currency.tsx`, `pseudoJev.ts`, `globals.css`) are copied into both Next apps on purpose. That keeps
each Vercel project self-contained (Root Directory = its folder), with no workspace tooling to configure.

## Run locally (three terminals)

```bash
cd bert-service && pip install -r requirements.txt && uvicorn main:app --port 8000
cd blog && npm install && npm run dev        # http://localhost:3000
cd app  && npm install && npm run dev        # http://localhost:3001  (copy .env.example → .env.local first)
```

## Environment variables

| Project | Variable | Local value | Production value |
|---|---|---|---|
| blog | `NEXT_PUBLIC_APP_URL` | `http://localhost:3001` | `https://<your-app>.vercel.app` |
| app | `AI_GATEWAY_API_KEY` | `vck_…` | same (Vercel → Settings → Environment Variables) |
| app | `TYPESAFE_API_KEY` | *(empty until you get one)* | TypeSafe key. It wins automatically. |
| app | `BERT_SERVICE_URL` | `http://127.0.0.1:8000` | `https://<user>-moodify-bert.hf.space` |
| app | `NEXT_PUBLIC_BLOG_URL` | `http://localhost:3000` | `https://<your-blog>.vercel.app` |
| app | `LAB_RATE_LIMIT_PER_MIN` | `300` | `60` for a public demo |

Only `vck_…` (AI Gateway key) goes in `AI_GATEWAY_API_KEY`. A `vcp_…` Vercel *account* token must never go in any env var of
this app.

## Deploying

The steps are in the order they depend on each other: BERT first, then the app, then the blog.

### 1. BERT service → Hugging Face Spaces (free, 16 GB RAM)
1. huggingface.co → **New Space** → name `moodify-bert`, SDK **Docker** → *Blank*, hardware **CPU basic (free)**.
2. **Files → Add file → Upload files**: upload `Dockerfile`, `README.md`, `main.py`, `requirements.txt` from `bert-service/`, then commit.
3. Wait for the build (~5–10 min: installs CPU torch and bakes the model into the image). Status turns **Running**.
4. Test it: `https://<user>-moodify-bert.hf.space/health` returns `"ok": true`.
5. Note: free Spaces sleep after ~48 h idle, and the first request after that takes a minute to wake it.

**Or Render (paid).** BERT-base needs ~1 GB RAM, and Render's Free/Starter plans (512 MB) run out of memory. Dashboard → **New → Blueprint**
→ pick this repo. `render.yaml` creates `moodify-bert` on the Standard plan (2 GB). Use `https://moodify-bert.onrender.com` as `BERT_SERVICE_URL`.

### 2. App → Vercel project #2
1. vercel.com → **Add New → Project** → import the GitHub repo.
2. **Root Directory: `app`** (Edit → select `app`). Framework preset: Next.js (auto).
3. Environment variables: `AI_GATEWAY_API_KEY`, `BERT_SERVICE_URL` (from step 1), `LAB_RATE_LIMIT_PER_MIN=60`.
   Leave `NEXT_PUBLIC_BLOG_URL` for step 4.
4. **Deploy**. Open `/compare`. The status bar should show *JEV · Vercel AI Gateway* and *BERT · online*.

### 3. Blog → Vercel project #1
1. **Add New → Project** → import the **same** repo again.
2. **Root Directory: `blog`**.
3. Environment variable: `NEXT_PUBLIC_APP_URL=https://<your-app>.vercel.app`.
4. **Deploy**.

### 4. Close the loop
In the **app** project → Settings → Environment Variables → add `NEXT_PUBLIC_BLOG_URL=https://<your-blog>.vercel.app` →
**Redeploy**. `NEXT_PUBLIC_*` values are baked in at build time, so a redeploy is required whenever you change them.

### Keeping deploys independent
Both Vercel projects watch the same repo. To stop a blog-only change from rebuilding the app (and vice versa), set
**Settings → Git → Ignored Build Step** to `git diff --quiet HEAD^ HEAD -- .` in each project. It skips the build when
nothing in that folder changed.

## JEV providers

`app/src/lib/jev/provider.ts` sends TypeSafe's native `/v1/systemone` request to whichever provider is configured:

| Provider | Key | Endpoint |
|---|---|---|
| TypeSafe direct | `TYPESAFE_API_KEY` | `https://api.typesafe.ai/v1/systemone` |
| Vercel AI Gateway | `AI_GATEWAY_API_KEY` | `https://ai-gateway.vercel.sh/typesafe/v1/systemone` |
| Mock | none | local imitation, flagged in the UI |

`JEV_PROVIDER=auto` picks TypeSafe, then Vercel, then mock. The AI Gateway returns `customer_verification_required` until a
card is on the Vercel account. OpenRouter doesn't host JEV, since it only serves chat models.
