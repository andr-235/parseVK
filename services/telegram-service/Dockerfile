FROM python:3.12.13-slim

COPY --from=ghcr.io/astral-sh/uv:0.11.6 /uv /uvx /bin/

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

WORKDIR /app

COPY libs/py/common ./libs/py/common
COPY services/telegram-service ./services/telegram-service

WORKDIR /app/services/telegram-service

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-install-project

RUN addgroup -g 1001 -S appuser && \
    adduser -S -u 1001 -G appuser appuser && \
    chown -R appuser:appuser /app

USER appuser

ENV PATH="/app/services/telegram-service/.venv/bin:$PATH"
ENV PYTHONPATH="/app/libs/py/common:/app/services/telegram-service"

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
