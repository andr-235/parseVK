# VK and Content Services Design

## Контекст

Текущая ветка `fastapi-microservices-rewrite` уже добавила параллельную
FastAPI-платформу рядом с NestJS:

- `api-gateway` для frontend BFF;
- `identity-service` для auth;
- `tasks-service` для per-user задач, automation, audit и task outbox;
- Kafka/outbox контур для событий.

`tasks-service` намеренно не выполняет VK parsing. Новые задачи могут оставаться
в `pending`, пока не появится execution-сервис. Следующий этап должен перенести
VK execution без возврата к монолитной границе.

## Решение

Добавляем два отдельных сервиса:

```text
services/
  vk-service/
  content-service/
```

`vk-service` отвечает только за ingestion/execution:

- читает Kafka events `task.created` и `task.resumed`;
- ходит во внешний VK API;
- пишет canonical VK data в свою PostgreSQL DB `vk-db`;
- обновляет task lifecycle/progress в `tasks-service` через internal API;
- публикует Kafka events `vk.*`.

`content-service` отвечает только за frontend reads:

- читает Kafka events `vk.*`;
- строит read models в своей PostgreSQL DB `content-db`;
- отдаёт read API через `api-gateway`;
- не ходит во внешний VK API;
- не исполняет задачи.

Kafka не используется как транспорт напрямую на frontend. Frontend всегда ходит
через `api-gateway`, а Kafka остаётся межсервисной шиной.

## Цель Этапа

Этап считается готовым, когда:

- `vk-service` может получить task event и выполнить controlled VK execution;
- `vk-service` сохраняет результат в `vk-db`;
- `vk-service` обновляет task status/progress через internal API `tasks-service`;
- `vk-service` публикует идемпотентные `vk.*` events;
- `content-service` строит read models из `vk.*` events в отдельной `content-db`;
- `api-gateway` отдаёт frontend read endpoints из `content-service`;
- NestJS `api/` остаётся fallback для не перенесённых endpoints.

## Не Входит В Этап

- удаление NestJS `api/`;
- миграция всей старой Prisma DB в новые БД;
- WebSocket progress через новый gateway;
- полнотекстовый поиск/Elasticsearch;
- Kafka-to-browser streaming;
- перенос Telegram/MAX/WhatsApp ingestion.

## Архитектура Потока

```text
frontend
  -> api-gateway
  -> tasks-service
  -> task outbox
  -> Kafka topic: task.events

vk-service
  <- Kafka topic: task.events
  -> VK API
  -> vk-db
  -> tasks-service internal progress/status API
  -> vk outbox
  -> Kafka topic: vk.events

content-service
  <- Kafka topic: vk.events
  -> content-db read models

frontend
  -> api-gateway
  -> content-service
  -> content-db
```

## Границы Владения

### `tasks-service`

Владеет задачами и их lifecycle:

- task row;
- status/progress;
- audit log;
- automation settings;
- task outbox events.

`tasks-service` не ходит во внешний VK API и не хранит VK posts/comments/authors.

Для `vk-service` нужно добавить internal update API:

```text
POST /internal/tasks/{task_id}/execution/start
POST /internal/tasks/{task_id}/execution/progress
POST /internal/tasks/{task_id}/execution/complete
POST /internal/tasks/{task_id}/execution/fail
```

Все endpoints требуют:

```text
X-Internal-Service-Token
X-Caller-Service: vk-service
X-Request-ID
X-Correlation-ID
```

`owner_user_id` не принимается от `vk-service` как authority для поиска task.
Task lookup идёт по `task_id`, а `tasks-service` сам знает owner.

### `vk-service`

Владеет canonical VK ingestion data:

- VK groups;
- VK posts;
- VK comments;
- VK authors;
- связь collected records с `task_id`;
- VK API request attempts and errors.

`vk-service` не отдаёт frontend read API. Его HTTP API на первом этапе может
содержать только `/health` и internal/admin diagnostics.

### `content-service`

Владеет read models для frontend:

- списки постов;
- списки комментариев;
- авторы;
- группы;
- агрегаты/счётчики, нужные UI;
- pagination/sorting/filtering projection.

`content-service` не ходит во внешний VK API и не меняет task lifecycle.

## Kafka Topics

### `task.events`

Producer: `tasks-service`.

Consumers:

- `vk-service`.

Events:

```text
task.created
task.resumed
task.deleted
```

`task.checked` остаётся audit-only и не публикуется в Kafka в текущем tasks slice.

Kafka key:

```text
task_id
```

Consumer idempotency:

- `vk-service` хранит processed task event ids;
- повторный `task.created` не создаёт второй execution run;
- `task.resumed` создаёт новый attempt только если task не `running`.

### `vk.events`

Producer: `vk-service`.

Consumers:

- `content-service`;
- будущие search/analytics services.

Events:

```text
vk.group_collected
vk.post_collected
vk.comment_collected
vk.author_collected
vk.task_progress_updated
vk.task_completed
vk.task_failed
```

Event naming follows the current outbox style:

```text
event_type = "vk.post_collected"
event_version = 1
```

No `.v1` suffix in `event_type`.

Kafka key:

- group events: `group_id`;
- post events: `post_id`;
- comment events: `comment_id`;
- author events: `author_id`;
- task progress/completion events: `task_id`.

Every event includes:

```json
{
  "event_id": "uuid",
  "event_type": "vk.post_collected",
  "event_version": 1,
  "aggregate_type": "vk_post",
  "aggregate_id": "123_456",
  "correlation_id": "req-1",
  "payload": {},
  "created_at": "2026-05-08T00:00:00Z"
}
```

Consumers must be idempotent by `event_id` and by natural external IDs.

## `vk-service` Data Model

`vk-service` uses a separate PostgreSQL DB `vk-db`.

Minimum tables:

### `vk_groups`

```text
id BIGSERIAL PK
vk_group_id BIGINT NOT NULL UNIQUE
screen_name TEXT NULL
name TEXT NULL
is_closed BOOLEAN NULL
raw JSONB NOT NULL
first_seen_at TIMESTAMPTZ NOT NULL
last_seen_at TIMESTAMPTZ NOT NULL
```

### `vk_authors`

```text
id BIGSERIAL PK
vk_author_id BIGINT NOT NULL UNIQUE
type TEXT NOT NULL -- user/group
display_name TEXT NULL
raw JSONB NOT NULL
first_seen_at TIMESTAMPTZ NOT NULL
last_seen_at TIMESTAMPTZ NOT NULL
```

### `vk_posts`

```text
id BIGSERIAL PK
vk_post_id BIGINT NOT NULL
vk_owner_id BIGINT NOT NULL
vk_group_id BIGINT NULL
author_vk_id BIGINT NULL
date TIMESTAMPTZ NULL
text TEXT NULL
raw JSONB NOT NULL
first_task_id BIGINT NOT NULL
last_task_id BIGINT NOT NULL
first_seen_at TIMESTAMPTZ NOT NULL
last_seen_at TIMESTAMPTZ NOT NULL
UNIQUE (vk_owner_id, vk_post_id)
```

### `vk_comments`

```text
id BIGSERIAL PK
vk_comment_id BIGINT NOT NULL
vk_owner_id BIGINT NOT NULL
vk_post_id BIGINT NOT NULL
author_vk_id BIGINT NULL
date TIMESTAMPTZ NULL
text TEXT NULL
raw JSONB NOT NULL
first_task_id BIGINT NOT NULL
last_task_id BIGINT NOT NULL
first_seen_at TIMESTAMPTZ NOT NULL
last_seen_at TIMESTAMPTZ NOT NULL
UNIQUE (vk_owner_id, vk_post_id, vk_comment_id)
```

### `vk_task_runs`

```text
id UUID PK
task_id BIGINT NOT NULL
owner_user_id TEXT NOT NULL
status TEXT NOT NULL -- pending/running/done/failed/cancelled
scope TEXT NOT NULL
mode TEXT NOT NULL
group_ids BIGINT[] NOT NULL
post_limit INT NULL
started_at TIMESTAMPTZ NULL
finished_at TIMESTAMPTZ NULL
processed_items INT NOT NULL DEFAULT 0
total_items INT NOT NULL DEFAULT 0
last_error TEXT NULL
created_at TIMESTAMPTZ NOT NULL
updated_at TIMESTAMPTZ NOT NULL
UNIQUE (task_id)
```

### `processed_events`

```text
event_id UUID PK
event_type TEXT NOT NULL
processed_at TIMESTAMPTZ NOT NULL
```

## `content-service` Data Model

`content-service` uses a separate PostgreSQL DB `content-db`.

Minimum read-model tables:

### `content_groups`

```text
id BIGSERIAL PK
vk_group_id BIGINT NOT NULL UNIQUE
screen_name TEXT NULL
name TEXT NULL
last_collected_at TIMESTAMPTZ NULL
updated_at TIMESTAMPTZ NOT NULL
```

### `content_authors`

```text
id BIGSERIAL PK
vk_author_id BIGINT NOT NULL UNIQUE
type TEXT NOT NULL
display_name TEXT NULL
updated_at TIMESTAMPTZ NOT NULL
```

### `content_posts`

```text
id BIGSERIAL PK
external_key TEXT NOT NULL UNIQUE -- vk_owner_id:vk_post_id
vk_owner_id BIGINT NOT NULL
vk_post_id BIGINT NOT NULL
vk_group_id BIGINT NULL
author_vk_id BIGINT NULL
date TIMESTAMPTZ NULL
text TEXT NULL
comments_count INT NOT NULL DEFAULT 0
last_collected_task_id BIGINT NULL
updated_at TIMESTAMPTZ NOT NULL
```

### `content_comments`

```text
id BIGSERIAL PK
external_key TEXT NOT NULL UNIQUE -- vk_owner_id:vk_post_id:vk_comment_id
post_external_key TEXT NOT NULL
vk_owner_id BIGINT NOT NULL
vk_post_id BIGINT NOT NULL
vk_comment_id BIGINT NOT NULL
author_vk_id BIGINT NULL
date TIMESTAMPTZ NULL
text TEXT NULL
last_collected_task_id BIGINT NULL
updated_at TIMESTAMPTZ NOT NULL
```

### `processed_events`

```text
event_id UUID PK
event_type TEXT NOT NULL
processed_at TIMESTAMPTZ NOT NULL
```

`content-service` projections are replace/upsert based on external keys. Duplicate
Kafka deliveries must not duplicate rows.

## Execution Semantics

### Task Start

When `vk-service` receives `task.created`:

1. Validate event envelope and payload.
2. Insert `processed_events` guard inside transaction.
3. Create or find `vk_task_runs` by `task_id`.
4. Call `tasks-service` `/execution/start`.
5. Execute VK collection.

If `processed_events` already contains the event id, the consumer acknowledges the
Kafka message without side effects.

### Task Progress

`vk-service` updates progress in two paths:

- direct internal callback to `tasks-service`;
- Kafka `vk.task_progress_updated` event for read/analytics consumers.

Progress payload:

```json
{
  "taskId": "123",
  "ownerUserId": "user-1",
  "processedItems": 10,
  "totalItems": 100,
  "progress": 0.1,
  "stats": {
    "groups": 5,
    "posts": 20,
    "comments": 300
  }
}
```

`tasks-service` remains the source of truth for task status/progress shown on the
tasks page.

### Task Completion

On success:

1. `vk-service` flushes `vk-db` writes.
2. `vk-service` writes final `vk.*` outbox events.
3. `vk-service` calls `tasks-service` `/execution/complete`.
4. `vk-service` publishes `vk.task_completed`.

On failure:

1. Store error in `vk_task_runs.last_error`.
2. Call `tasks-service` `/execution/fail`.
3. Publish `vk.task_failed`.

Errors must not log tokens, raw Authorization headers, or secrets.

## API Contracts

### `tasks-service` Internal Execution API

`POST /internal/tasks/{task_id}/execution/start`

Request:

```json
{
  "runId": "uuid",
  "worker": "vk-service"
}
```

Effect:

- allowed from `pending`, `failed`, `cancelled`;
- sets `status = running`;
- clears `error`;
- writes audit `task.execution_started`;
- returns current task response.

If task is already `running`, return `409`.
If task does not exist, return `404`.

`POST /internal/tasks/{task_id}/execution/progress`

Request:

```json
{
  "processedItems": 10,
  "totalItems": 100,
  "progress": 0.1,
  "stats": {
    "groups": 5,
    "posts": 20,
    "comments": 300
  }
}
```

Effect:

- allowed only for `running`;
- validates `0 <= progress <= 1`;
- validates `processedItems <= totalItems`;
- updates `processed_items`, `total_items`, `progress`, `stats`;
- writes audit `task.progress_updated` at throttled intervals or on material
  progress changes.

`POST /internal/tasks/{task_id}/execution/complete`

Request:

```json
{
  "processedItems": 100,
  "totalItems": 100,
  "stats": {
    "groups": 5,
    "posts": 20,
    "comments": 300
  }
}
```

Effect:

- allowed only for `running`;
- sets `status = done`;
- sets `progress = 1`;
- writes audit `task.completed`.

`POST /internal/tasks/{task_id}/execution/fail`

Request:

```json
{
  "error": "VK API rate limit exceeded",
  "processedItems": 10,
  "totalItems": 100,
  "stats": {
    "groups": 5,
    "posts": 20,
    "comments": 300
  }
}
```

Effect:

- allowed for `pending` or `running`;
- sets `status = failed`;
- stores sanitized `error`;
- writes audit `task.failed`.

### `content-service` Public Read API Through Gateway

Gateway routes:

```text
GET /api/v1/content/groups
GET /api/v1/content/groups/{vk_group_id}
GET /api/v1/content/posts
GET /api/v1/content/posts/{external_key}
GET /api/v1/content/comments
GET /api/v1/content/authors
GET /api/v1/content/authors/{vk_author_id}
```

Internal routes:

```text
GET /internal/content/groups
GET /internal/content/groups/{vk_group_id}
GET /internal/content/posts
GET /internal/content/posts/{external_key}
GET /internal/content/comments
GET /internal/content/authors
GET /internal/content/authors/{vk_author_id}
```

Gateway validates access token before forwarding. `content-service` internal API
requires `X-Internal-Service-Token` and receives `X-User-ID` for future
per-user visibility rules. The first slice may expose global collected content
to authenticated users if existing product behavior is global.

Pagination:

```text
page >= 1
limit BETWEEN 1 AND 100
default page = 1
default limit = 20
ORDER BY date DESC NULLS LAST, id DESC
```

## VK API Scope

First execution slice supports current task modes:

```text
mode = recent_posts
mode = recheck_group
scope = all
scope = selected
```

For `selected`, `group_ids` come from the task.

For `all`, the first implementation may use the existing configured monitored
groups source if it is available through a stable DB/API. If no clean source is
available, `scope=all` tasks fail with a clear task error:

```text
No group source configured for scope=all
```

This is preferable to silently executing an undefined set of groups.

## Reliability

- Every service uses one SQLAlchemy `AsyncSession` per request/job.
- Kafka consumers are idempotent by `event_id`.
- Database upserts are idempotent by VK external IDs.
- `vk-service` outbox publishes `vk.*` only after DB transaction commits.
- `content-service` stores processed event ids before acknowledging effects.
- Consumers use retry with backoff and a failed/dead-letter state.
- Long VK execution must have timeouts and clear task failure, not infinite
  running state.

## Security

Never log:

- VK token;
- access token;
- refresh token;
- password;
- private key;
- `Authorization`;
- `Set-Cookie`.

`vk-service` receives VK credentials only from env. Secrets are not published in
Kafka payloads or stored in read models.

Internal endpoints require:

```text
X-Internal-Service-Token
X-Caller-Service
X-Request-ID
X-Correlation-ID
```

## Implementation Slicing

Recommended PR sequence:

```text
PR-015: tasks-service execution internal API
PR-016: vk-service skeleton, vk-db, Alembic, health
PR-017: vk-service Kafka consumer and task lifecycle callbacks
PR-018: vk-service VK API adapter and canonical storage
PR-019: vk-service vk.* outbox publisher
PR-020: content-service skeleton, content-db, projections consumer
PR-021: content-service read API and gateway routes
PR-022: Docker compose, smoke tests, docs
```

## Open Decisions

Resolved:

1. `vk-service` writes to its own `vk-db`.
2. `content-service` uses its own `content-db`.
3. Frontend reads go through `api-gateway`, not Kafka.
4. `content-service` is a read-model/projection service, not a VK API client.

Still to decide during planning:

1. Exact source for `scope=all` group list in the first real VK execution slice.
2. Whether `content-service` read data is globally visible to all authenticated
   users or scoped by owner in the first slice.
3. Whether first implementation uses real VK API immediately or begins with a
   deterministic fake VK adapter behind the same interface for smoke tests.

## Test Strategy

Python unit/API tests:

- task execution start/progress/complete/fail transitions;
- invalid transitions return `409`;
- progress validates numeric invariants;
- task events consumer is idempotent by `event_id`;
- VK storage upserts by external IDs;
- `vk.*` outbox payloads contain no secrets;
- content projection consumer is idempotent;
- content read API pagination/sorting;
- gateway forwards content read requests only after access token validation.

Docker smoke:

```text
login
create task
publish task.created
vk-service consumes event
vk-service marks task running
vk-service writes vk-db rows
vk-service publishes vk.*
content-service builds read model
gateway returns content posts/comments
task becomes done
```

For the first smoke, using a fake VK adapter is acceptable if real VK credentials
are not available locally. Production runtime must use the real VK adapter.
