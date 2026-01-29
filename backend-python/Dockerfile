# Python AI Service Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Set env variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    # Spacy model selection (build & runtime)
    SPACY_MODEL=en_core_web_lg \
    # Gunicorn config
    WEB_CONCURRENCY=1 \
    WORKERS_PER_CORE=1 \
    MAX_WORKERS=1 \
    TIMEOUT=300

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install CPU-only PyTorch first to avoid downloading CUDA deps (saves ~2GB)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Install remaining requirements
RUN pip install --no-cache-dir -r requirements.txt

# Download spaCy model for Presidio AT BUILD TIME
# This validates functionality and embeds model in image
RUN python -m spacy download ${SPACY_MODEL}

# Copy application code
COPY . .

# Create directories for data
RUN mkdir -p /app/data /app/models /app/chroma_db

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/ || exit 1

# Run with gunicorn
# -w 1: Enforce single worker to prevent OOM
# --preload: Load app in master process (saves RAM)
# --timeout 300: Allow 5 mins for initial model loading
CMD gunicorn app.main:app \
    --workers 1 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --timeout 300 \
    --preload
