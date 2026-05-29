FROM python:3.12.13-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

COPY libs/py/common ./libs/py/common
COPY services/vk-service ./services/vk-service

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir ./libs/py/common -e ./services/vk-service

WORKDIR /app/services/vk-service

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
