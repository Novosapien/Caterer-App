# WhatsApp Gig Agent — Cloud Run image (Python 3.11 runtime)
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps for psycopg (libpq) — binary wheel usually suffices, but keep the
# runtime lib available.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

# Cloud Run provides $PORT (default 8080). Bind uvicorn to it.
ENV PORT=8080
EXPOSE 8080

# Single worker keeps the shared Postgres checkpointer connection simple; scale
# via Cloud Run instances, not in-process workers.
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT} --workers 1
