# FastAPI Microservices

Этот срез добавляет параллельную FastAPI-платформу рядом с текущим NestJS API.
Старый сервис `api` остаётся fallback для существующих `/api` endpoints.

## Состав

- `api-gateway` - публичный BFF для frontend auth.
- `identity-service` - пользователи, Argon2id password hashes, RS256 JWT, refresh rotation.
- `identity-db` - отдельная PostgreSQL база identity.
- `kafka` - Apache Kafka в single-node KRaft режиме для local/dev.
- `outbox_events` - транзакционный publish path для identity events.

Kafka в compose работает в combined `broker,controller` режиме только для local/dev.
Production topology нужно описывать отдельно.

## Локальный запуск

```bash
docker compose up -d identity-db kafka identity-migrate identity-seed-admin identity-service api-gateway
```

Проверка health:

```bash
curl -fsS http://127.0.0.1:3002/health
```

Smoke auth flow:

```bash
IDENTITY_ADMIN_PASSWORD=admin-change-me scripts/smoke-fastapi-auth.sh
```

Скрипт проходит non-destructive flow: `login -> refresh -> me -> logout`.
`change-password` не выполняется автоматически, чтобы не менять seed admin пароль.

## Frontend routing

Frontend собирается с:

```text
VITE_API_URL=/api
VITE_GATEWAY_API_URL=/api
```

Nginx проксирует:

- `/api/v1/auth/*` в `api-gateway`;
- остальные `/api/*` в текущий NestJS `api`.

Так frontend auth уже идёт через FastAPI BFF, а остальной функционал остаётся на рабочем API.

## Security defaults

Для local/dev refresh cookie запускается с `GATEWAY_REFRESH_COOKIE_SECURE=false`, потому что
smoke идёт по HTTP. В этом режиме используются cookie names без `__Host-`, иначе браузер
и `curl` отбросят cookie как невалидные.

В production нужно выставлять:

```text
GATEWAY_REFRESH_COOKIE_NAME=__Host-refresh_token
GATEWAY_CSRF_COOKIE_NAME=__Host-csrf_token
GATEWAY_REFRESH_COOKIE_SECURE=true
GATEWAY_REFRESH_COOKIE_SAMESITE=lax
FASTAPI_INTERNAL_SERVICE_TOKEN=<strong shared secret>
IDENTITY_ADMIN_PASSWORD=<strong initial admin password>
```

Refresh token не отдаётся в JSON и не хранится во frontend state. Он живёт только в
`HttpOnly` cookie, а frontend держит access token в памяти.
