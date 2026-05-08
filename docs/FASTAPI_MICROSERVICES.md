# FastAPI Microservices

Этот срез добавляет параллельную FastAPI-платформу рядом с текущим NestJS API.
Старый сервис `api` остаётся fallback для существующих `/api` endpoints.

## Состав

- `api-gateway` - публичный BFF для frontend auth.
- `identity-service` - пользователи, Argon2id password hashes, RS256 JWT, refresh rotation.
- `identity-db` - отдельная PostgreSQL база identity.
- `tasks-service` - per-user задачи, audit log, automation settings, task outbox.
- `tasks-db` - отдельная PostgreSQL база tasks.
- `vk-service` - execution/ingestion VK задач, canonical VK storage, `vk.*` outbox.
- `vk-db` - отдельная PostgreSQL база canonical VK данных.
- `content-service` - frontend read models по `vk.*` events.
- `content-db` - отдельная PostgreSQL база read models.
- `kafka` - Apache Kafka в single-node KRaft режиме для local/dev.
- `outbox_events` - транзакционный publish path для identity/task events.

Kafka в compose работает в combined `broker,controller` режиме только для local/dev.
Production topology нужно описывать отдельно.

## Локальный запуск

```bash
docker compose up -d identity-db identity-migrate identity-seed-admin identity-service tasks-db tasks-migrate tasks-service vk-db vk-migrate vk-service content-db content-migrate content-service api-gateway
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

Smoke tasks flow:

```bash
IDENTITY_ADMIN_PASSWORD=admin-change-me scripts/smoke-fastapi-tasks.sh
```

Скрипт проходит flow: `login -> create task -> list -> detail -> audit -> automation settings -> delete`.
`tasks-service` не выполняет VK parsing в этом срезе; новые задачи могут оставаться
в `pending` до реализации `vk-service`.

Smoke VK/content flow:

```bash
IDENTITY_ADMIN_PASSWORD=admin-change-me scripts/smoke-fastapi-vk-content.sh
```

Скрипт проверяет flow: `login -> create scope=all task без выбора групп -> wait task done -> gateway content posts`.
Для локального dev по умолчанию используется `VK_SERVICE_USE_FAKE_VK_ADAPTER=true`, поэтому
реальный VK token не нужен до включения настоящего adapter. Для `scope=all` локальный
источник групп задаётся через `VK_SERVICE_DEFAULT_GROUP_IDS`, по умолчанию `[1]`.

## Frontend routing

Frontend собирается с:

```text
VITE_API_URL=/api
VITE_GATEWAY_API_URL=/api
```

Nginx проксирует:

- `/api/v1/auth/*` в `api-gateway`;
- `/api/v1/tasks/*` в `api-gateway`;
- `/api/v1/content/*` в `api-gateway`;
- остальные `/api/*` в текущий NestJS `api`.

Так frontend auth и tasks уже идут через FastAPI BFF, а остальной функционал остаётся на рабочем API.

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
