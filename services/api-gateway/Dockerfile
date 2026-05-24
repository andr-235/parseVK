FROM python:3.12.13-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY libs/py/common ./libs/py/common
COPY services/api-gateway ./services/api-gateway

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir ./libs/py/common ./services/api-gateway

WORKDIR /app/services/api-gateway

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
