FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY libs/py/common ./libs/py/common
COPY services/identity-service ./services/identity-service

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir ./libs/py/common ./services/identity-service

WORKDIR /app/services/identity-service

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
