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

The YAML header above is the Hugging Face Spaces config. Upload this folder's files (`Dockerfile`, `README.md`, `main.py`,
`requirements.txt`) to a new **Docker** Space. For Render, see `render.yaml` at the repo root. It needs a plan with at
least 2 GB RAM, because BERT-base doesn't fit in 512 MB.
