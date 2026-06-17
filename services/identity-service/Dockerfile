FROM python:3.12.13-slim

RUN pip install uv==0.11.6

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

WORKDIR /app

COPY libs/py/common ./libs/py/common
COPY services/identity-service ./services/identity-service

WORKDIR /app/services/identity-service

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-install-project

ENV PATH="/app/services/identity-service/.venv/bin:$PATH"
ENV PYTHONPATH="/app/libs/py/common:/app/services/identity-service"

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
