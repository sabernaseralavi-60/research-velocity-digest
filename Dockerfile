FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY pipeline ./pipeline
COPY config ./config

# Default: the daily database job. Run the digest CLI instead with:
#   docker compose run --rm ai-paper-digest -m pipeline.main --dry-run
ENTRYPOINT ["python"]
CMD ["-m", "pipeline.daily"]
