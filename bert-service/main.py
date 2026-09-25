"""
Moodify BERT service — the "before" side of the BERT vs JEV lab.

Wraps the same model Moodify uses (nlptown/bert-base-multilingual-uncased-sentiment,
5 classes = 1..5 stars) behind a small FastAPI app that reports *where time goes*
(tokenize / forward pass / total) so the lab can compare it fairly with JEV.

Run:
    pip install -r requirements.txt
    uvicorn main:app --port 8000

Env:
    BERT_MODEL_PATH  HF model id or local folder (e.g. ../../Moodify-WebApp/Backend/model)
    BERT_MAX_LENGTH  token truncation length (default 512)
"""

import os
import time
from contextlib import asynccontextmanager

# PyTorch only — stops transformers importing TF/JAX (avoids ml_dtypes version clashes).
os.environ.setdefault("USE_TF", "0")
os.environ.setdefault("USE_FLAX", "0")
os.environ.setdefault("USE_JAX", "0")

import torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from transformers import AutoModelForSequenceClassification, AutoTokenizer

MODEL_PATH = os.getenv("BERT_MODEL_PATH", "nlptown/bert-base-multilingual-uncased-sentiment")
MAX_LENGTH = int(os.getenv("BERT_MAX_LENGTH", "512"))
MAX_BATCH = 256

# Same label order Moodify uses (index 0 = 1 star ... index 4 = 5 stars).
LABELS = ["very_negative", "negative", "neutral", "positive", "very_positive"]
DISPLAY = ["Very Negative", "Negative", "Neutral", "Positive", "Very Positive"]

state: dict = {}


@asynccontextmanager
async def lifespan(_: FastAPI):
    t0 = time.perf_counter()
    device = "cuda" if torch.cuda.is_available() else "cpu"
    local = os.path.isdir(MODEL_PATH)
    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH, local_files_only=local)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH, local_files_only=local)
    model.to(device).eval()
    state.update(tokenizer=tokenizer, model=model, device=device)
    # Warm-up so the first real request isn't penalised by lazy init.
    _predict(["warm up"])
    state["load_seconds"] = round(time.perf_counter() - t0, 2)
    print(f"BERT ready on {device} in {state['load_seconds']}s ({MODEL_PATH})")
    yield
    state.clear()


app = FastAPI(title="Moodify BERT service", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class PredictIn(BaseModel):
    text: str = Field(min_length=1, max_length=5000)


class BatchIn(BaseModel):
    texts: list[str] = Field(min_length=1, max_length=MAX_BATCH)


def _predict(texts: list[str]):
    tokenizer, model, device = state["tokenizer"], state["model"], state["device"]

    t0 = time.perf_counter()
    tokens = tokenizer(texts, return_tensors="pt", padding=True, truncation=True, max_length=MAX_LENGTH)
    tokens = {k: v.to(device) for k, v in tokens.items()}
    t1 = time.perf_counter()
    with torch.inference_mode():
        logits = model(**tokens).logits
    if device == "cuda":
        torch.cuda.synchronize()
    t2 = time.perf_counter()
    probs = torch.softmax(logits, dim=-1).cpu().tolist()

    results = []
    for row in probs:
        idx = max(range(len(row)), key=row.__getitem__)
        results.append({
            "label": LABELS[idx],
            "display": DISPLAY[idx],
            "stars": idx + 1,
            "confidence": round(row[idx], 4),
            "probabilities": {LABELS[i]: round(p, 4) for i, p in enumerate(row)},
            # Expected star rating — comparable with JEV's interpolated score.
            "score": round(sum((i + 1) * p for i, p in enumerate(row)), 3),
        })
    timings = {
        "tokenize_ms": round((t1 - t0) * 1000, 2),
        "inference_ms": round((t2 - t1) * 1000, 2),
        "total_ms": round((time.perf_counter() - t0) * 1000, 2),
    }
    return results, timings


@app.get("/")
def root():
    return {"service": "Moodify BERT", "endpoints": ["/health", "/predict", "/predict/batch", "/docs"]}


@app.get("/health")
def health():
    return {
        "ok": "model" in state,
        "model": MODEL_PATH,
        "device": state.get("device"),
        "load_seconds": state.get("load_seconds"),
        "labels": LABELS,
        "threads": torch.get_num_threads(),
    }


@app.post("/predict")
def predict(body: PredictIn):
    if not body.text.strip():
        raise HTTPException(400, "text is empty")
    results, timings = _predict([body.text])
    return {**results[0], "timings": timings}


@app.post("/predict/batch")
def predict_batch(body: BatchIn):
    texts = [t for t in body.texts if t and t.strip()]
    if not texts:
        raise HTTPException(400, "no non-empty texts")
    results, timings = _predict(texts)
    return {"results": results, "timings": timings, "count": len(texts)}
