[← API Reference](api.md) · [Back to README](../README.md) · [Testing →](testing.md)

# Configuration

> `.env` — единственный источник secrets и настроек окружения. Никогда не коммитить.

## Управление конфигом

Все сервисы используют **pydantic-settings** (`BaseSettings`) — типизировано, с валидацией на старте.

Общий принцип: каждый сервис читает только свои переменные с префиксом `{SERVICE}_*`.

## Основные переменные

| Variable | Description |
|----------|-------------|
| `POSTGRES_*` | Основная БД (общие данные) |
| `{SERVICE}_POSTGRES_*` | БД конкретного сервиса |
| `LISTINGS_DATABASE_URL` | БД сервиса объявлений (listings) |
| `TELEGRAM_SERVICE_DATABASE_URL` | БД сервиса Telegram |
| `FASTAPI_INTERNAL_SERVICE_TOKEN` | Токен для межсервисного HTTP |
| `VK_TOKEN` | VK API токен (права: wall, groups, users, offline) |
| `TELEGRAM_API_ID/HASH` | Telegram API credentials (Telethon) |
| `TASKS_AUTOMATION_SCHEDULER_ENABLED` | Включает фоновый планировщик автоматизации задач (tasks-service) |
| `VITE_*` | Frontend-переменные (Vite env) |
| `WAPPI_*` | IM-сервис (WhatsApp через Wappi.pro) |
| `REALTIME_DATABASE_URL` | `postgresql+asyncpg://realtime:realtime@realtime-db:5432/realtime` | Realtime DB |
| `REALTIME_KAFKA_CONSUMER_ENABLED` | `false` | Enable Kafka consumer |
| `REALTIME_RETENTION_HOURS` | `24` | Event retention window |
| `VK_SERVICE_TOKEN_FILE` | — | Path to the mounted VK token file (preferred secret source, see below) |
| `VK_SERVICE_TARGET_REQUESTS_PER_SECOND` | `3.0` | Scheduler rate target per account |
| `VK_SERVICE_RATE_LIMIT_MAX_RETRIES` | `5` | Retry budget for transient/rate-limit errors |
| `VK_SERVICE_RETRY_MAX_ELAPSED_SECONDS` | `300` | Overall retry window for a request |
| `VK_SERVICE_SHORT_BACKOFF_BASE_SECONDS` | `1.0` | Base exponential backoff delay |
| `VK_SERVICE_ACCOUNT_COOLDOWN_SECONDS` | `300` | Account cooldown after flood errors (code 6) |
| `VK_SERVICE_HARD_LIMIT_COOLDOWN_SECONDS` | `3600` | Account cooldown after hard limit (code 29) |
| `CONTENT_CONTENT_PROJECTION_EVENTS_ENABLED` | `true` | Projection events |
| `VITE_REALTIME_ENABLED` | `true` | Frontend SSE connection |
| `VPN_SERVICE_TELEGRAM_URL` | SOCKS5-прокси для Telegram |

### Tasks Service

| Variable | Default | Description |
|----------|---------|-------------|
| `TASKS_KAFKA_CONSUMER_ENABLED` | `false` | Enable event-driven progress consumer (`task.execution_progressed` from vk-service) |
| `KAFKA_BOOTSTRAP_SERVERS` | `kafka:9092` | Kafka bootstrap servers |
| `TASKS_SOURCES_API_ENABLED` | `false` | Enable sources/access-scope API (`/internal/sources`, `/internal/tasks/{id}/sources`, `/internal/access-scopes`) |
| `TASKS_SOURCE_COMPAT_WRITE_ENABLED` | `false` | Compatibility write path: mirrors legacy `group_ids` into normalized `task_sources` and freezes immutable `TaskRun` snapshots on task create/start (issue #283/#284) |

## Пример .env

```bash
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password
LISTINGS_POSTGRES_PASSWORD=listings_dev_password_change_me
TELEGRAM_POSTGRES_PASSWORD=telegram_dev_password_change_me

# Service-specific
VK_SERVICE_VK_TOKEN=vk123...
VK_SERVICE_TASK_WORKER_ENABLED=true
VK_SERVICE_TASK_WORKER_CONCURRENCY=2
VK_SERVICE_TASK_WORKER_POLL_SECONDS=1
VK_SERVICE_TASK_LEASE_SECONDS=90
VK_SERVICE_TASK_HEARTBEAT_SECONDS=20
VK_SERVICE_TASK_TIMEOUT_SECONDS=1800
VK_SERVICE_TASK_MAX_ATTEMPTS=3
VK_SERVICE_VK_API_TIMEOUT_SECONDS=20
IDENTITY_ADMIN_PASSWORD=admin-secure-password

# Internal
FASTAPI_INTERNAL_SERVICE_TOKEN=dev-internal-token
```

`VK_SERVICE_TASK_WORKER_CONCURRENCY` ограничивает параллельный парсинг. Lease должен
быть длиннее heartbeat; просроченный lease автоматически подхватывается другим worker.
`VK_SERVICE_TASK_TIMEOUT_SECONDS` ограничивает полное время одной задачи, а
`VK_SERVICE_VK_API_TIMEOUT_SECONDS` — отдельный сетевой вызов VK.

## P3 staged VK ingestion transport

Подготовленные post/comment parts публикуются только в новый ingress-контур. До финального
cutover staged publisher остаётся выключенным, поэтому наличие topic/configuration само по
себе не включает новый production runtime.

| Variable | Default | Purpose |
|----------|---------|---------|
| `VK_SERVICE_STAGED_PART_PUBLISHER_ENABLED` | `false` | Enable the staged-only publisher after the integration contour is ready |
| `VK_SERVICE_KAFKA_TOPIC_VK_INGESTION` | `parsevk.content.ingestion.vk` | Staged ingress topic |
| `VK_SERVICE_KAFKA_TOPIC_VK_INGESTION_DLQ` | `parsevk.content.ingestion.vk.dlq` | Staged ingress DLQ |
| `VK_SERVICE_STAGED_PART_PRODUCER_MAX_REQUEST_BYTES` | `1048576` | Producer request ceiling; must stay above the 768 KiB application hard limit including key/header overhead |
| `CONTENT_KAFKA_TOPIC_VK_INGESTION` | `parsevk.content.ingestion.vk` | Typed future content-consumer ingress setting |
| `CONTENT_KAFKA_TOPIC_VK_INGESTION_DLQ` | `parsevk.content.ingestion.vk.dlq` | Typed future content-consumer DLQ setting |
| `CONTENT_KAFKA_VK_INGESTION_FETCH_MAX_BYTES` | `1048576` | Future content-consumer total fetch ceiling |
| `CONTENT_KAFKA_VK_INGESTION_MAX_PARTITION_FETCH_BYTES` | `1048576` | Future content-consumer per-partition fetch ceiling |

### Retention boundaries

Kafka retention и PostgreSQL staging retention — разные механизмы и не должны быть
связаны одним TTL:

- `parsevk.content.ingestion.vk` не задаёт topic-level `retention.ms` и наследует broker
  log-retention policy. Изменение broker retention не меняет жизненный цикл staging rows.
- `parsevk.content.ingestion.vk.dlq` использует `cleanup.policy=delete` и явный
  `retention.ms=604800000` (7 суток).
- `vk_ingestion_staging_batches` хранится в PostgreSQL как durable replay source. Staging
  намеренно переживает cleanup execution-attempt records; отдельного time-based Kafka TTL
  у него нет. Его lifecycle связан с родительским `vk_executions` через FK `ON DELETE CASCADE`.

Transport limits также независимы от retention: application hard limit равен 768 KiB, а
producer/topic/future-consumer limits для staged ingress равны 1 MiB. Legacy IM topics
сохраняют существующий лимит 5 MiB и этим P3-срезом не уменьшаются.

## VK credentials: precedence and fallback

Приоритет источника секрета VK (см. `services/vk-service/docs/vk-provider-accounts.md`):

1. `VK_SERVICE_TOKEN_FILE` — путь к смонтированному файлу с токеном (предпочтительный путь, Docker secrets / mounted volume).
2. `VK_SERVICE_VK_TOKEN` — **deprecated** legacy env-путь. Если задан только он, сервис логирует deprecation-warning — fallback **не молчаливый**.
3. Если не задано ни одного — сервис падает на старте с `VK_SERVICE_VK_TOKEN or VK_SERVICE_TOKEN_FILE is required`.

На старте сервис выполняет reconciliation: валидирует токен один раз (`users.get`), обновляет
запись `vk_provider_accounts` (статус `active`/`invalid`/`cooling_down`/`disabled`) и метрику
`/health` `vkAccountStatus`. Невалидный токен не роняет контейнер, но воркер не берёт новые
задачи, пока аккаунт не вернётся в `active` (см. playbook по ротации токена в
`services/vk-service/docs/vk-provider-accounts.md`).

## See Also

- [Deploy Runbook](deploy-runbook.md) — production environment setup
- [API Reference](api.md) — endpoints requiring auth headers
