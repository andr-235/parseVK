FROM python:3.12.13-slim

COPY --from=ghcr.io/astral-sh/uv:0.11.6 /uv /uvx /bin/

WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

COPY libs/py/common ./libs/py/common
COPY services/tasks-service ./services/tasks-service

WORKDIR /app/services/tasks-service

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-install-project

ENV PATH="/app/services/tasks-service/.venv/bin:$PATH"
ENV PYTHONPATH="/app/libs/py/common:/app/services/tasks-service"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
