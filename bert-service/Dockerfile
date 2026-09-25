# Moodify BERT service. Works on Hugging Face Spaces (Docker SDK) and on Render.
FROM python:3.11-slim

# Hugging Face Spaces runs containers as uid 1000, so build as that user too.
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    HF_HOME=/home/user/.cache/huggingface \
    PORT=7860
WORKDIR /home/user/app

# CPU-only torch first (~200 MB instead of the ~2 GB CUDA build), then the rest.
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --user torch --index-url https://download.pytorch.org/whl/cpu \
 && pip install --no-cache-dir --user -r requirements.txt

# Bake the model into the image so cold starts don't download 670 MB.
RUN python -c "from transformers import AutoTokenizer, AutoModelForSequenceClassification as M; n='nlptown/bert-base-multilingual-uncased-sentiment'; AutoTokenizer.from_pretrained(n); M.from_pretrained(n)"

COPY --chown=user main.py .

EXPOSE 7860
# Render injects $PORT; Hugging Face uses app_port (7860, the default above).
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
