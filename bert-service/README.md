---
title: Moodify BERT
emoji: 🎭
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
short_description: BERT sentiment API for the BERT vs JEV comparison app
---

# Moodify BERT service

A FastAPI wrapper around `nlptown/bert-base-multilingual-uncased-sentiment` (5 classes, 1–5 stars), the model from Moodify.
The comparison app (`../app`) calls it from its `/api/bert` route.

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/health` | none | model, device, load time |
| POST | `/predict` | `{"text": "..."}` | label, stars, confidence, 5 probabilities, timings |
| POST | `/predict/batch` | `{"texts": ["...", "..."]}` | results + batch timings |

## Run locally

```bash
pip install -r requirements.txt
uvicorn main:app --port 8000
```

## Deploy

You usually don't need to. In production the app calls Hugging Face's hosted copy of this model (`HF_TOKEN`). This
service exists for local development, where it gives real forward-pass timings. To self-host anyway, use `render.yaml`
at the repo root (Render Standard plan: BERT-base needs ~1 GB RAM). The YAML header above lets the folder run as a
Docker Space on Hugging Face if you have access to Docker Spaces.
