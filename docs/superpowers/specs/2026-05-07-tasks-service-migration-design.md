# Tasks Service Migration Design

## Контекст

Первый FastAPI-срез уже добавил `api-gateway`, `identity-service`, отдельную
identity DB, auth BFF, outbox и Docker smoke. Следующий этап продолжает работу в
ветке `fastapi-microservices-rewrite` и переносит контур задач из NestJS в новый
FastAPI microservice.

Текущий NestJS `api/src/tasks` обслуживает:

- список задач и детали;
- создание parse-задач;
- resume/check/delete;
- audit log;
- task automation settings и ручной запуск automation;
- WebSocket progress;
- фактическое выполнение VK parsing через текущий NestJS/VK контур.

Этот этап не переносит VK parsing execution. Он переносит ownership задач,
automation settings и frontend API в новый `tasks-service`, а перенос VK worker
выносится в следующий этап `vk-service`.

## Цель

Создать `tasks-service` как отдельный FastAPI-сервис, который владеет задачами,
audit log, automation settings и task events через outbox.

Этап считается готовым, когда:

- frontend получает tasks API через `api-gateway`;
- `tasks-service` хранит задачи в своей PostgreSQL DB;
- create/list/detail/audit/resume/check/delete работают через gateway;
- automation settings и manual run работают через gateway;
- task mutations пишут audit log и outbox events;
- NestJS `api/` остаётся доступным fallback для не перенесённых endpoints.

## Не входит в этап

- перенос VK parsing worker;
- перенос VK groups/posts/comments/authors storage;
- Kafka consumers для task execution;
- WebSocket progress через новый gateway;
- миграция старых rows из Prisma `Task` в новую DB;
- удаление или отключение NestJS `api/src/tasks`.

Новые задачи, созданные в `tasks-service`, могут оставаться в `pending` до
появления `vk-service` worker. Это ожидаемое ограничение этапа.

## Рассмотренные подходы

### Подход A: tasks-service владеет задачами, execution позже

`tasks-service` получает отдельную DB, API, audit, automation и outbox. Создание
parse-задачи создаёт task row и event `task.created`. Реальный VK worker
подключается следующим этапом.

Это выбранный подход. Он даёт чистую границу сервиса и не смешивает перенос задач
с внешним VK API.

### Подход B: tasks-service вызывает старый NestJS API

Новый сервис мог бы хранить задачи и синхронно вызывать NestJS для create/resume
execution. Это быстрее сохраняет старое поведение, но создаёт два источника
правды и жёсткую runtime-зависимость нового сервиса от старого.

### Подход C: перенос tasks и VK worker вместе

Такой вариант сразу даёт полноценный функционал, но слишком крупный для одного
среза: задачи, VK API, фоновые jobs, retry, progress, storage и frontend
переключение оказались бы в одном PR.

## Архитектура

Новые компоненты:

```text
services/
  tasks-service/
    app/
      main.py
      core/
        config.py
        logging.py
      db/
        base.py
        session.py
        models.py
      modules/
        tasks/
          router.py
          schemas.py
          service.py
          repository.py
          mapper.py
        automation/
          router.py
          schemas.py
          service.py
          repository.py
        outbox/
          repository.py
          service.py
          publisher.py
      tests/
    alembic/
```

`api-gateway` получает typed client для `tasks-service` и публичные routes
`/api/v1/tasks/*`.

`tasks-service` не публикуется наружу. Все internal endpoints требуют
`X-Internal-Service-Token`, принимают `X-User-ID`, `X-Request-ID` /
`X-Correlation-ID` и возвращают единый error envelope.

`tasks-service` не принимает публичный JWT напрямую. Он доверяет `X-User-ID`
только если `X-Internal-Service-Token` валиден. Все list/detail/resume/check/delete
queries scoped by `owner_user_id`.

## Данные

`tasks-service` использует отдельную PostgreSQL DB, например `parsevk_tasks`.
Старую Prisma-схему не меняем и не переиспользуем.

### `tasks`

```text
id BIGSERIAL PK
owner_user_id TEXT NOT NULL
title TEXT NOT NULL
description JSONB NULL
status TEXT NOT NULL DEFAULT 'pending'
scope TEXT NULL
mode TEXT NULL
group_ids BIGINT[] NOT NULL DEFAULT '{}'
post_limit INT NULL
total_items INT NOT NULL DEFAULT 0
processed_items INT NOT NULL DEFAULT 0
progress DOUBLE PRECISION NOT NULL DEFAULT 0
stats JSONB NULL
error TEXT NULL
skipped_groups_message TEXT NULL
created_at TIMESTAMPTZ NOT NULL
updated_at TIMESTAMPTZ NOT NULL
```

Status values for this stage:

```text
pending
running
done
failed
cancelled
```

`status` is the source of truth. `completed` is not stored; it is derived in API
responses as `status == "done"`.

DB constraints:

```text
status IN ('pending', 'running', 'done', 'failed', 'cancelled')
progress >= 0 AND progress <= 1
total_items >= 0
processed_items >= 0
post_limit IS NULL OR post_limit BETWEEN 1 AND 100
scope IS NULL OR scope IN ('all', 'selected')
mode IS NULL OR mode IN ('recent_posts', 'recheck_group')
```

`title` is generated server-side when the request has no title. Format:
`VK parse: <scope> / <mode>`.

Frontend compatibility keeps camelCase fields in responses: `completed`,
`totalItems`, `processedItems`, `createdAt`, and `updatedAt`.
`progress` remains a fraction from `0` to `1`, matching the current frontend
mapper that derives processed count as `totalItems * progress`.

### `task_audit_logs`

```text
id BIGSERIAL PK
aggregate_type TEXT NOT NULL DEFAULT 'task'
aggregate_id TEXT NULL
task_id BIGINT NULL FK tasks(id) ON DELETE SET NULL
event_type TEXT NOT NULL
event_data JSONB NULL
created_at TIMESTAMPTZ NOT NULL
```

Audit events for this stage:

```text
task.created
task.resumed
task.checked
task.deleted
task.automation_settings_updated
task.automation_run_requested
```

Audit event names do not include versions. Versioned event names are reserved
for outbox. Example: `audit.event_type = task.created`,
`outbox.event_type = task.created.v1`.

`task.deleted` audit rows must survive hard delete. Before deleting the task,
the service writes audit and outbox records with a snapshot:

```json
{
  "taskId": "123",
  "status": "pending",
  "scope": "selected",
  "mode": "recent_posts",
  "groupIds": [1, 2],
  "postLimit": 10
}
```

### `task_automation_settings`

Single-row table:

```text
id BIGINT PK DEFAULT 1 CHECK (id = 1)
enabled BOOLEAN NOT NULL DEFAULT false
run_hour INT NOT NULL DEFAULT 9 CHECK (run_hour BETWEEN 0 AND 23)
run_minute INT NOT NULL DEFAULT 0 CHECK (run_minute BETWEEN 0 AND 59)
post_limit INT NOT NULL DEFAULT 10 CHECK (post_limit BETWEEN 1 AND 100)
timezone_offset_minutes INT NOT NULL DEFAULT 0 CHECK (timezone_offset_minutes BETWEEN -720 AND 840)
last_run_at TIMESTAMPTZ NULL
created_at TIMESTAMPTZ NOT NULL
updated_at TIMESTAMPTZ NOT NULL
```

The service creates the row idempotently through a seed/init command or first
access. Hidden startup mutation is avoided unless explicitly configured for
local/dev.

Every automation run locks the singleton settings row in a transaction before
checking active tasks and creating a new task. This prevents two concurrent
manual runs from creating duplicate pending tasks.

This slice keeps `timezone_offset_minutes` for compatibility with the existing
frontend contract. It does not model daylight saving time. A later hardening
step may replace it with an IANA timezone field.

### `outbox_events`

Same outbox pattern as `identity-service`:

```text
id UUID PK
event_type TEXT NOT NULL
event_version INT NOT NULL
aggregate_type TEXT NOT NULL
aggregate_id TEXT NOT NULL
correlation_id TEXT NULL
payload JSONB NOT NULL
status TEXT NOT NULL DEFAULT 'pending'
attempts INT NOT NULL DEFAULT 0
next_attempt_at TIMESTAMPTZ NOT NULL
locked_at TIMESTAMPTZ NULL
published_at TIMESTAMPTZ NULL
last_error TEXT NULL
created_at TIMESTAMPTZ NOT NULL
```

Kafka key is `task_id`. Consumers must be idempotent by `event_id`.

## API Contract

Gateway public routes:

```text
POST   /api/v1/tasks/parse
GET    /api/v1/tasks
GET    /api/v1/tasks/{task_id}
GET    /api/v1/tasks/{task_id}/audit-log
POST   /api/v1/tasks/{task_id}/resume
POST   /api/v1/tasks/{task_id}/check
DELETE /api/v1/tasks/{task_id}
GET    /api/v1/tasks/automation/settings
POST   /api/v1/tasks/automation/settings
POST   /api/v1/tasks/automation/run
```

Internal `tasks-service` routes:

```text
POST   /internal/tasks/parse
GET    /internal/tasks
GET    /internal/tasks/{task_id}
GET    /internal/tasks/{task_id}/audit-log
POST   /internal/tasks/{task_id}/resume
POST   /internal/tasks/{task_id}/check
DELETE /internal/tasks/{task_id}
GET    /internal/tasks/automation/settings
POST   /internal/tasks/automation/settings
POST   /internal/tasks/automation/run
```

The frontend request body for parse task remains compatible:

```json
{
  "scope": "all",
  "groupIds": [1, 2],
  "postLimit": 10,
  "mode": "recent_posts"
}
```

Validation rules:

- `scope`: `all` or `selected`, default `all`;
- `mode`: `recent_posts` or `recheck_group`, default `recent_posts`;
- `groupIds`: required only for `selected`, integers only;
- `postLimit`: 1..100, default 10.

Task detail response:

```json
{
  "id": 1,
  "title": "VK parse: selected / recent_posts",
  "description": {},
  "completed": false,
  "totalItems": 0,
  "processedItems": 0,
  "progress": 0,
  "status": "pending",
  "scope": "selected",
  "mode": "recent_posts",
  "groupIds": [1, 2],
  "postLimit": 10,
  "stats": null,
  "error": null,
  "skippedGroupsMessage": null,
  "createdAt": "2026-05-07T12:00:00Z",
  "updatedAt": "2026-05-07T12:00:00Z"
}
```

List response remains compatible with current frontend:

```json
{
  "tasks": [],
  "total": 0,
  "page": 1,
  "limit": 20,
  "totalPages": 0,
  "hasMore": false
}
```

## Behavior

### Create Parse Task

`POST /tasks/parse`:

1. validates payload;
2. creates a task with `pending` status;
3. stores normalized task config in explicit columns and `description`;
4. writes `task.created` audit log;
5. writes `task.created.v1` outbox event;
6. returns task detail.

No VK parsing is executed in this stage.

### Resume

`POST /tasks/{id}/resume`:

- allowed for `failed`, `cancelled`, and `pending`;
- forbidden for `running` and `done`, returns `409`;
- sets status to `pending`;
- clears error;
- writes `task.resumed` audit and `task.resumed.v1` outbox event.

### Check

`POST /tasks/{id}/check`:

- if task is `running`, leaves it unchanged;
- if task is `pending`, keeps it pending and emits check event;
- if task is terminal, returns current state;
- writes `task.checked` audit event;
- writes `task.checked.v1` outbox event only when external observers need it.

Because execution is not migrated yet, check does not call VK.

### Delete

`DELETE /tasks/{id}`:

- allowed for `pending`, `failed`, `cancelled`, and `done`;
- forbidden for `running`, returns `409`;
- writes `task.deleted` audit with `task_snapshot`;
- writes `task.deleted.v1` outbox event with the same snapshot before deletion
  in the same transaction using the task id as aggregate id;
- deletes task row after audit/outbox writes;
- returns `204`.

### Automation Settings

`GET /tasks/automation/settings` returns:

```json
{
  "enabled": false,
  "runHour": 9,
  "runMinute": 0,
  "postLimit": 10,
  "timezoneOffsetMinutes": 0,
  "lastRunAt": null,
  "nextRunAt": null,
  "isRunning": false
}
```

`POST /tasks/automation/settings` validates and persists settings.

### Automation Run

`POST /tasks/automation/run`:

1. checks that no task is currently `running`;
2. finds the latest completed task with reusable config;
3. creates a new pending task with the configured `postLimit`;
4. updates `last_run_at`;
5. emits audit and outbox events.

The active-task check and task creation happen in one transaction while holding
the singleton settings row lock.

Latest completed task means:

```text
status = 'done'
scope IS NOT NULL
mode IS NOT NULL
group_ids is available
```

`postLimit` comes from automation settings, not from the old task.

Successful run writes:

1. `task.created` audit for the new task;
2. `task.created.v1` outbox event;
3. `task.automation_run_requested` audit event;
4. `task.automation_run_requested.v1` outbox event;
5. `settings.last_run_at` update.

If no completed task exists, returns:

```json
{
  "started": false,
  "reason": "Нет завершённых задач для повторного запуска",
  "settings": {}
}
```

When no completed task exists, no task row and no `task.created` event are
created. The service may write `task.automation_run_requested` audit with
`started=false`; it does not write outbox unless downstream consumers need
no-op requests.

## Gateway Responsibilities

Gateway:

- validates access token using existing auth infrastructure;
- extracts authenticated user id from access token;
- forwards authorized requests to `tasks-service`;
- passes trusted internal headers: `X-User-ID`, `X-Request-ID`,
  `X-Correlation-ID`, `X-Internal-Service-Token`;
- maps internal errors to frontend-compatible HTTP responses;
- owns the public `/api/v1/tasks/*` contract.

Gateway does not store tasks and does not implement task business logic.

## Frontend Migration

Frontend tasks API switches from `API_URL/tasks` to gateway `/api/v1/tasks`.
The UI should not receive fake task data. Empty backend state must render as an
empty task list.

Existing task mappers can remain if response shape is compatible. WebSocket hook
is not migrated in this stage; it may remain connected to old namespace during
transition or be disabled for new FastAPI tasks. Polling/detail refresh remains
the supported progress mechanism for this slice.

## Events

Outbox event envelope uses `libs/py/common/common/events.py`.

Initial event types:

```text
task.created.v1
task.resumed.v1
task.checked.v1
task.deleted.v1
task.automation_settings_updated.v1
task.automation_run_requested.v1
```

Payloads must not include access tokens, refresh tokens, passwords, cookies, or
Authorization headers.

`Idempotency-Key` is optional for task-creating operations in this slice. If
implemented, `tasks-service` stores it per `owner_user_id` and repeated requests
return the original task. Gateway must not automatically retry non-idempotent
POST requests without an idempotency key.

## Testing

Python tests:

- task model/repository CRUD;
- create/list/detail/audit API;
- list/detail/resume/check/delete are scoped by `owner_user_id`;
- user A cannot access user B task;
- validation for `scope`, `groupIds`, `postLimit`, `mode`;
- resume/check/delete behavior;
- running task delete returns `409`;
- completed field is derived from `status == "done"`;
- automation settings validation;
- automation settings table cannot have more than one row;
- automation run with and without completed task;
- concurrent automation run creates only one task;
- outbox event creation;
- delete writes outbox before task row deletion;
- delete audit persists with nullable `task_id` and snapshot;
- gateway tasks client and routes;
- internal token protection;
- response uses camelCase frontend fields;
- no Authorization/cookie/token values are present in outbox payload.

Frontend tests:

- tasks API calls gateway paths;
- empty list remains empty;
- create/resume/check/delete map responses into store;
- automation settings API uses gateway paths;
- gateway client does not retry POST without `Idempotency-Key`.

Smoke:

```text
health -> auth login -> create task -> list -> detail -> audit -> automation settings -> delete
```

## Rollout

1. Add `tasks-service` skeleton, DB, Alembic, health.
2. Implement task models, repository, service, router, tests.
3. Implement automation settings and manual run.
4. Add outbox event path.
5. Add gateway typed client and public tasks routes.
6. Switch frontend tasks/automation API to gateway.
7. Add Docker Compose services and smoke script.
8. Keep NestJS `api/` fallback untouched.

## Risks

- New tasks will not execute VK parsing until `vk-service` exists. This is an
  explicit scope boundary, not a defect.
- Old NestJS tasks and new FastAPI tasks live in separate DBs during transition.
  The UI may show only new FastAPI tasks after switching.
- Realtime progress is deferred. Users may need manual refresh or polling until
  Kafka/WebSocket progress is implemented.
- Automation run creates a pending task but does not execute parsing in this
  stage.
- Duplicate POST can create duplicate tasks if the client retries without
  `Idempotency-Key`. This is documented as a follow-up hardening path.

## Resolved Decisions

1. Task ownership: tasks are scoped by `owner_user_id` from the
   gateway-authenticated user.
2. Delete audit policy: hard delete task rows, but retain audit rows with
   nullable `task_id` and task snapshot.
3. Status source of truth: `status` is canonical; `completed` is response-only
   compatibility field.
4. Automation concurrency: manual run uses transaction-level lock on singleton
   settings row.
5. Timezone model: keep `timezone_offset_minutes` for compatibility in this
   slice; consider IANA timezone later.
6. Scope boundary: `tasks-service` owns tasks API, DB, audit, automation
   settings and outbox; VK execution moves to the later `vk-service` migration.
