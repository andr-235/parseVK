FROM python:3.12.13-slim

RUN pip install uv==0.11.6

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

WORKDIR /app

COPY --chown=appuser:appuser libs/py/common ./libs/py/common
COPY --chown=appuser:appuser services/api-gateway ./services/api-gateway

WORKDIR /app/services/api-gateway

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-install-project

ENV PATH="/app/services/api-gateway/.venv/bin:$PATH"
ENV PYTHONPATH="/app/libs/py/common:/app/services/api-gateway"

RUN groupadd -r -g 1001 appuser && useradd -r -u 1001 -g appuser appuser

EXPOSE 8000

USER appuser

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health', timeout=3)" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
