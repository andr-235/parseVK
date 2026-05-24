FROM python:3.12.13-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

COPY libs/py/common ./libs/py/common
COPY services/moderation-service ./services/moderation-service

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir ./libs/py/common ./services/moderation-service

WORKDIR /app/services/moderation-service

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
