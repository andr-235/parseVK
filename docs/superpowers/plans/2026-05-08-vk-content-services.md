# VK and Content Services Implementation Plan — Revised

> Status note, 2026-05-22: this checklist is stale. The factual migration
> status is tracked in `docs/BACKEND_MIGRATION_STATUS.md`; use this plan as
> historical implementation context, not as the current source of truth.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `vk-service` for VK execution/canonical storage and `content-service` for frontend read models.

**Architecture:** `tasks-service` remains task lifecycle owner. `vk-service` consumes task events, calls VK API, writes `vk-db`, updates task execution state, and publishes `vk.*` events. `content-service` consumes `vk.*` events into its own `content-db` and serves read API through `api-gateway`.

**Tech Stack:** FastAPI, Pydantic v2, SQLAlchemy 2 async, Alembic, pytest, httpx, aiokafka `>=0.14,<1.0`, PostgreSQL, Apache Kafka, Docker Compose.

---

## Source Spec

Implement against:

```text
docs/superpowers/specs/2026-05-08-vk-content-services-design.md
```

Do not remove or disable current NestJS `api/`. It remains fallback until all
frontend read paths are migrated.

## PR Slicing

1. `PR-015`: `tasks-service` internal execution API with `runId` idempotency.
2. `PR-016`: `vk-service` skeleton, DB, Alembic, health.
3. `PR-017`: `vk-service` task event consumer and lifecycle callbacks.
4. `PR-018`: `vk-service` VK API adapter and canonical storage.
5. `PR-019`: `vk-service` `vk.*` outbox publisher.
6. `PR-020`: `content-service` skeleton, DB, projection consumer.
7. `PR-021`: `content-service` read API and gateway routes.
8. `PR-022`: Docker Compose, smoke scripts, docs.

## Shared Rules

- `vk-service` is the only new service that talks to external VK API.
- `content-service` never talks to external VK API.
- `content-service` has its own `content-db`; it does not read `vk-db` directly.
- Kafka events use `event_type` without `.v1`; numeric version is in `event_version`.
- Execution callbacks are idempotent by `runId`.
- Every consumer is idempotent by `(consumer_name, event_id)`.
- Domain upserts use natural external keys, not generated row ids.
- Outbox rows that represent domain events use `dedupe_key` where repeated
  retries could create duplicate events.
- FastAPI long-running consumers/publishers are wired through lifespan, not
  deprecated startup/shutdown event handlers.
- Pydantic models use `ConfigDict(validate_by_name=True, validate_by_alias=True)`
  instead of `populate_by_name=True`.
- Async FastAPI tests use `httpx.AsyncClient` with `ASGITransport` and pin
  `anyio_backend = "asyncio"` to avoid accidental Trio execution.
- Never log VK token, access token, refresh token, password, private key,
  `Authorization`, or `Set-Cookie`.
- Use one SQLAlchemy `AsyncSession` per request/job.

---

## Pre-flight Before PR-015

Before changing execution callbacks, verify the actual `tasks-service` ORM and
Alembic state. Do not assume columns exist.

- [ ] **Step 1: Inspect current Task model fields**

Run:

```bash
rg -n "processed_items|progress|stats|execution_run_id|status" services/tasks-service/app/db/models.py services/tasks-service/alembic/versions
```

Expected:

- `processed_items`, `progress`, and `stats` already exist;
- `execution_run_id` does not exist yet and must be added by PR-015.

- [ ] **Step 2: Inspect Alembic heads**

Run:

```bash
docker compose run --rm tasks-migrate alembic heads
```

Expected: a single head revision. If this command cannot run locally because
Docker images are not present, use:

```bash
find services/tasks-service/alembic/versions -maxdepth 1 -type f -name '*.py' -print
```

Expected: one current migration file before PR-015.

- [ ] **Step 3: Update PR-015 file list if reality differs**

If any expected field is missing, add it through an Alembic migration in PR-015
before service code writes to it. Do not write application code against columns
that are not present in the SQLAlchemy model and migration.

## Task 1: PR-015 Tasks Execution Internal API

**Files:**
- Modify: `services/tasks-service/app/db/models.py`
- Create: `services/tasks-service/alembic/versions/20260508_0002_add_task_execution_run_id.py`
- Modify: `services/tasks-service/app/modules/tasks/schemas.py`
- Modify: `services/tasks-service/app/modules/tasks/repository.py`
- Modify: `services/tasks-service/app/modules/tasks/service.py`
- Modify: `services/tasks-service/app/modules/tasks/router.py`
- Test: `services/tasks-service/tests/test_task_execution_api.py`

- [ ] **Step 1: Write execution API tests**

Create `services/tasks-service/tests/test_task_execution_api.py` with tests for:

```python
import sys
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.main import create_app
from app.modules.tasks.router import get_tasks_service


@pytest.fixture
def anyio_backend():
    return "asyncio"


class FakeTasksService:
    def __init__(self):
        self.calls = []

    async def start_execution(self, task_id, payload, request_id=None, correlation_id=None):
        self.calls.append(("start", task_id, payload))
        return {"id": task_id, "status": "running", "completed": False}

    async def update_execution_progress(self, task_id, payload, request_id=None, correlation_id=None):
        self.calls.append(("progress", task_id, payload))
        return {
            "id": task_id,
            "status": "running",
            "completed": False,
            "processedItems": payload.processed_items,
            "totalItems": payload.total_items,
            "progress": payload.progress,
        }

    async def complete_execution(self, task_id, payload, request_id=None, correlation_id=None):
        self.calls.append(("complete", task_id, payload))
        return {"id": task_id, "status": "done", "completed": True}

    async def fail_execution(self, task_id, payload, request_id=None, correlation_id=None):
        self.calls.append(("fail", task_id, payload))
        return {"id": task_id, "status": "failed", "completed": False, "error": payload.error}


@pytest.fixture
def app():
    app = create_app()
    service = FakeTasksService()

    async def override_tasks_service():
        return service

    app.dependency_overrides[get_tasks_service] = override_tasks_service
    app.state.fake_tasks_service = service
    return app


def headers():
    return {
        "X-Internal-Service-Token": "dev-internal-token",
        "X-Caller-Service": "vk-service",
        "X-Request-ID": "req-1",
        "X-Correlation-ID": "corr-1",
    }


@pytest.mark.anyio
async def test_start_execution_requires_internal_auth(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/internal/tasks/1/execution/start", json={"runId": "run-1", "worker": "vk-service"})

    assert response.status_code == 403


@pytest.mark.anyio
async def test_start_execution_route(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/internal/tasks/1/execution/start",
            headers=headers(),
            json={"runId": "run-1", "worker": "vk-service"},
        )

    assert response.status_code == 200
    assert response.json()["status"] == "running"


@pytest.mark.anyio
async def test_progress_validation_rejects_processed_gt_total(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/internal/tasks/1/execution/progress",
            headers=headers(),
            json={"runId": "run-1", "processedItems": 11, "totalItems": 10, "progress": 1, "stats": {}},
        )

    assert response.status_code == 422


@pytest.mark.anyio
async def test_complete_and_fail_routes(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        complete = await client.post(
            "/internal/tasks/1/execution/complete",
            headers=headers(),
            json={"runId": "run-1", "processedItems": 10, "totalItems": 10, "stats": {"posts": 10}},
        )
        failed = await client.post(
            "/internal/tasks/2/execution/fail",
            headers=headers(),
            json={"runId": "run-2", "error": "VK API rate limit exceeded", "processedItems": 1, "totalItems": 10, "stats": {}},
        )

    assert complete.status_code == 200
    assert complete.json()["status"] == "done"
    assert failed.status_code == 200
    assert failed.json()["status"] == "failed"
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
pytest services/tasks-service/tests/test_task_execution_api.py -q
```

Expected: fails because execution routes and schemas do not exist.

- [ ] **Step 3: Add execution run column**

Add to `Task` in `services/tasks-service/app/db/models.py`:

```python
execution_run_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
```

Create Alembic migration
`services/tasks-service/alembic/versions/20260508_0002_add_task_execution_run_id.py`:

```python
"""add task execution run id"""

import sqlalchemy as sa
from alembic import op

revision = "20260508_0002"
down_revision = "20260507_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("tasks", sa.Column("execution_run_id", sa.String(length=128), nullable=True))
    op.create_index("ix_tasks_execution_run_id", "tasks", ["execution_run_id"])


def downgrade() -> None:
    op.drop_index("ix_tasks_execution_run_id", table_name="tasks")
    op.drop_column("tasks", "execution_run_id")
```

- [ ] **Step 4: Add execution schemas**

Add to `services/tasks-service/app/modules/tasks/schemas.py`:

```python
from uuid import UUID


class ExecutionStartRequest(BaseModel):
    run_id: UUID | str = Field(alias="runId")
    worker: str

    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True)


class ExecutionProgressRequest(BaseModel):
    run_id: UUID | str = Field(alias="runId")
    processed_items: int = Field(ge=0, alias="processedItems")
    total_items: int = Field(ge=0, alias="totalItems")
    progress: float = Field(ge=0, le=1)
    stats: dict[str, Any] | None = None

    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True)

    @model_validator(mode="after")
    def validate_counts(self) -> "ExecutionProgressRequest":
        if self.processed_items > self.total_items:
            raise ValueError("processedItems must be less than or equal to totalItems")
        return self


class ExecutionCompleteRequest(BaseModel):
    run_id: UUID | str = Field(alias="runId")
    processed_items: int = Field(ge=0, alias="processedItems")
    total_items: int = Field(ge=0, alias="totalItems")
    stats: dict[str, Any] | None = None

    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True)

    @model_validator(mode="after")
    def validate_counts(self) -> "ExecutionCompleteRequest":
        if self.processed_items > self.total_items:
            raise ValueError("processedItems must be less than or equal to totalItems")
        return self


class ExecutionFailRequest(BaseModel):
    run_id: UUID | str = Field(alias="runId")
    error: str = Field(min_length=1, max_length=2000)
    processed_items: int = Field(default=0, ge=0, alias="processedItems")
    total_items: int = Field(default=0, ge=0, alias="totalItems")
    stats: dict[str, Any] | None = None

    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True)

    @model_validator(mode="after")
    def validate_counts(self) -> "ExecutionFailRequest":
        if self.processed_items > self.total_items:
            raise ValueError("processedItems must be less than or equal to totalItems")
        return self
```

- [ ] **Step 5: Add repository method by task id**

Add to `TasksRepository`:

```python
async def get_task_by_id(self, task_id: int) -> Task | None:
    return await self.session.get(Task, task_id)
```

- [ ] **Step 6: Add service execution methods**

Add methods to `TasksService`:

```python
async def start_execution(self, task_id: int, payload, request_id=None, correlation_id=None) -> dict:
    task = await self.repository.get_task_by_id(task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    if task.status == "running":
        if task.execution_run_id == str(payload.run_id):
            return task_to_response(task)
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Task already running")
    if task.status == "done":
        if task.execution_run_id == str(payload.run_id):
            return task_to_response(task)
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Task already completed")
    task.execution_run_id = str(payload.run_id)
    task.status = "running"
    task.error = None
    await self.repository.add_audit(
        TaskAuditLog(
            owner_user_id=task.owner_user_id,
            aggregate_type="task",
            aggregate_id=str(task.id),
            task_id=task.id,
            event_type="task.execution_started",
            event_data={"taskId": str(task.id), "runId": str(payload.run_id), "worker": payload.worker},
        )
    )
    task = await self.repository.touch_task(task)
    return task_to_response(task)

async def update_execution_progress(self, task_id: int, payload, request_id=None, correlation_id=None) -> dict:
    task = await self.repository.get_task_by_id(task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    if task.status != "running":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Task is not running")
    if task.execution_run_id != str(payload.run_id):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Execution run mismatch")
    task.processed_items = payload.processed_items
    task.total_items = payload.total_items
    task.progress = payload.progress
    task.stats = payload.stats
    task = await self.repository.touch_task(task)
    return task_to_response(task)

async def complete_execution(self, task_id: int, payload, request_id=None, correlation_id=None) -> dict:
    task = await self.repository.get_task_by_id(task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    if task.status == "done" and task.execution_run_id == str(payload.run_id):
        return task_to_response(task)
    if task.status != "running":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Task is not running")
    if task.execution_run_id != str(payload.run_id):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Execution run mismatch")
    task.status = "done"
    task.processed_items = payload.processed_items
    task.total_items = payload.total_items
    task.progress = 1
    task.stats = payload.stats
    await self.repository.add_audit(
        TaskAuditLog(
            owner_user_id=task.owner_user_id,
            aggregate_type="task",
            aggregate_id=str(task.id),
            task_id=task.id,
            event_type="task.completed",
            event_data={"taskId": str(task.id)},
        )
    )
    task = await self.repository.touch_task(task)
    return task_to_response(task)

async def fail_execution(self, task_id: int, payload, request_id=None, correlation_id=None) -> dict:
    task = await self.repository.get_task_by_id(task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    if task.status == "failed" and task.execution_run_id == str(payload.run_id):
        return task_to_response(task)
    if task.execution_run_id and task.execution_run_id != str(payload.run_id):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Execution run mismatch")
    task.execution_run_id = str(payload.run_id)
    task.status = "failed"
    task.error = payload.error
    task.processed_items = payload.processed_items
    task.total_items = payload.total_items
    task.progress = task.processed_items / task.total_items if task.total_items else 0
    task.stats = payload.stats
    await self.repository.add_audit(
        TaskAuditLog(
            owner_user_id=task.owner_user_id,
            aggregate_type="task",
            aggregate_id=str(task.id),
            task_id=task.id,
            event_type="task.failed",
            event_data={"taskId": str(task.id), "error": payload.error},
        )
    )
    task = await self.repository.touch_task(task)
    return task_to_response(task)
```

- [ ] **Step 7: Add routes before dynamic task id reads**

Import execution schemas and add routes before `@router.get("/{task_id}")`:

```python
@router.post("/{task_id}/execution/start")
async def start_execution(...):
    return await service.start_execution(task_id, payload, request_id=x_request_id, correlation_id=x_correlation_id)
```

Repeat for `/progress`, `/complete`, and `/fail`.

- [ ] **Step 8: Run tasks-service tests**

Run:

```bash
pytest services/tasks-service/tests -q
```

Expected: all tasks-service tests pass.

- [ ] **Step 9: Commit PR-015**

```bash
git add services/tasks-service
git commit -m "feat: добавлен execution api для tasks service"
```

---

## Task 2: PR-016 VK Service Skeleton, DB, Alembic, Health

**Files:**
- Create: `services/vk-service/pyproject.toml`
- Create: `services/vk-service/Dockerfile`
- Create: `services/vk-service/app/main.py`
- Create: `services/vk-service/app/core/config.py`
- Create: `services/vk-service/app/db/base.py`
- Create: `services/vk-service/app/db/session.py`
- Create: `services/vk-service/app/db/models.py`
- Create: `services/vk-service/alembic.ini`
- Create: `services/vk-service/alembic/env.py`
- Create: `services/vk-service/alembic/versions/20260508_0001_create_vk_tables.py`
- Create: `services/vk-service/tests/_service_path.py`
- Create: `services/vk-service/tests/test_health.py`
- Create: `services/vk-service/tests/test_models.py`

- [ ] **Step 1: Create package metadata and Dockerfile**

Use the existing Python service pattern from `tasks-service`.

`pyproject.toml` dependencies:

```toml
[project]
name = "parsevk-vk-service"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
  "aiokafka>=0.14,<1.0",
  "alembic>=1.13",
  "asyncpg>=0.29",
  "fastapi>=0.115",
  "httpx>=0.27",
  "pydantic-settings>=2.4",
  "sqlalchemy[asyncio]>=2.0",
  "uvicorn[standard]>=0.30",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["app"]
```

- [ ] **Step 2: Add settings**

`services/vk-service/app/core/config.py`:

```python
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="VK_SERVICE_", extra="ignore")

    app_name: str = "parseVK VK Service"
    database_url: str = "postgresql+asyncpg://vk:vk@vk-db:5432/vk"
    internal_service_token: str = "dev-internal-token"
    tasks_base_url: str = "http://tasks-service:8000"
    kafka_bootstrap_servers: str = "kafka:9092"
    kafka_topic_tasks: str = "parsevk.tasks.events"
    kafka_topic_vk: str = "parsevk.vk.events"
    kafka_consumer_enabled: bool = False
    outbox_publish_enabled: bool = False
    vk_token: str = Field(default="", repr=False)
    use_fake_vk_adapter: bool = True


settings = Settings()
```

- [ ] **Step 3: Add DB models**

Implement models from the spec:

- `VkGroup`
- `VkAuthor`
- `VkPost`
- `VkComment`
- `VkTaskRun`
- `ProcessedEvent`
- `OutboxEvent`

Use unique constraints on VK external keys.

`ProcessedEvent` must use:

```text
consumer_name TEXT NOT NULL
event_id UUID NOT NULL
event_type TEXT NOT NULL
processed_at TIMESTAMPTZ NOT NULL
UNIQUE (consumer_name, event_id)
```

`OutboxEvent` must include:

```text
dedupe_key TEXT NULL
UNIQUE (dedupe_key) WHERE dedupe_key IS NOT NULL
```

- [ ] **Step 4: Add Alembic migration**

Create migration matching models. Include indexes:

```text
vk_posts(vk_group_id, date)
vk_comments(vk_owner_id, vk_post_id)
vk_task_runs(task_id)
outbox_events(status, next_attempt_at)
processed_events(consumer_name, event_id)
```

- [ ] **Step 5: Add health and model tests**

Tests:

```bash
pytest services/vk-service/tests/test_health.py services/vk-service/tests/test_models.py -q
```

Expected: health returns `{"status":"UP"}` and model tables/unique constraints exist.

- [ ] **Step 6: Add lifespan placeholder**

`services/vk-service/app/main.py` must use FastAPI lifespan even before the
Kafka consumer is fully wired:

```python
from contextlib import asynccontextmanager

from fastapi import FastAPI


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="parseVK VK Service", lifespan=lifespan)

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "UP"}

    return app
```

Do not use `@app.on_event("startup")` or `@app.on_event("shutdown")`.

- [ ] **Step 7: Commit PR-016**

```bash
git add services/vk-service
git commit -m "feat: добавлен каркас vk service"
```

---

## Task 3: PR-017 VK Consumer and Task Lifecycle Callbacks

**Files:**
- Create: `services/vk-service/app/clients/tasks/client.py`
- Create: `services/vk-service/app/modules/tasks/events.py`
- Create: `services/vk-service/app/modules/tasks/consumer.py`
- Create: `services/vk-service/app/modules/tasks/service.py`
- Test: `services/vk-service/tests/test_task_consumer.py`
- Test: `services/vk-service/tests/test_tasks_client.py`

- [ ] **Step 1: Add typed tasks-service client**

Client methods:

```python
start_execution(task_id: int, run_id: str) -> dict
update_progress(task_id: int, run_id: str, processed_items: int, total_items: int, progress: float, stats: dict) -> dict
complete_execution(task_id: int, run_id: str, processed_items: int, total_items: int, stats: dict) -> dict
fail_execution(task_id: int, run_id: str, error: str, processed_items: int, total_items: int, stats: dict) -> dict
```

Headers:

```text
X-Internal-Service-Token
X-Caller-Service: vk-service
X-Request-ID
X-Correlation-ID
```

- [ ] **Step 2: Add event parser**

Parse task event envelope:

```python
class TaskEvent(BaseModel):
    event_id: UUID
    event_type: Literal["task.created", "task.resumed", "task.deleted"]
    event_version: int
    aggregate_id: str
    correlation_id: str | None = None
    payload: dict[str, Any]
```

Expose:

```python
def task_id(self) -> int:
    return int(self.payload["taskId"])
```

- [ ] **Step 3: Add idempotent handler**

Handler behavior:

```text
task.created/task.resumed:
  if (consumer_name, event_id) processed -> ack no-op
  runId = event_id string
  create/find vk_task_runs by task_id and run_id
  call tasks-service start_execution(task_id, runId)
  later progress/complete/fail callbacks must reuse the same runId
  commit processed event in the same DB transaction as local state

task.deleted:
  mark local run cancelled if present
  commit processed event
```

The stable `runId = event_id` rule is intentional: if the process crashes after
the HTTP `start_execution` callback but before local commit, Kafka retry sends
the same event with the same run id, and `tasks-service` can return an
idempotent success instead of `409`.

- [ ] **Step 4: Add tests**

Test:

- duplicate event does not call tasks client twice;
- malformed missing `taskId` fails without secret logging;
- `task.deleted` marks run cancelled;
- `task.created` calls start execution.

- [ ] **Step 5: Wire consumer through lifespan**

Modify `services/vk-service/app/main.py` lifespan to start/stop the Kafka
consumer task only when consumer mode is enabled:

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    consumer = TaskEventsConsumer()
    task = None
    if settings.kafka_consumer_enabled:
        task = asyncio.create_task(consumer.run_forever())
    try:
        yield
    finally:
        if task:
            task.cancel()
            with suppress(asyncio.CancelledError):
                await task
        await consumer.stop()
```

The exact class names may differ, but lifecycle ownership must stay in lifespan.
Tests should instantiate handlers directly and should not require a running Kafka
broker.

- [ ] **Step 6: Commit PR-017**

```bash
git add services/vk-service
git commit -m "feat: добавлен consumer задач в vk service"
```

---

## Task 4: PR-018 VK Adapter and Canonical Storage

**Files:**
- Create: `services/vk-service/app/modules/vk_api/client.py`
- Create: `services/vk-service/app/modules/vk_api/fake_client.py`
- Create: `services/vk-service/app/modules/ingestion/repository.py`
- Create: `services/vk-service/app/modules/ingestion/service.py`
- Test: `services/vk-service/tests/test_ingestion.py`

- [ ] **Step 1: Define VK adapter interface**

Interface methods:

```python
async def get_groups(group_ids: list[int]) -> list[dict]
async def get_posts(group_id: int, *, mode: str, post_limit: int | None) -> list[dict]
async def get_comments(owner_id: int, post_id: int) -> list[dict]
```

- [ ] **Step 2: Add fake adapter for tests/smoke**

Fake adapter returns deterministic group/post/comment payloads from requested
group ids. It must not require `VK_SERVICE_VK_TOKEN`.

- [ ] **Step 3: Add real VK adapter**

Use `httpx.AsyncClient` against VK API. Read token from `VK_SERVICE_VK_TOKEN`.
If token is missing and fake adapter is disabled, fail startup or task execution
with a sanitized error:

```text
VK token is not configured
```

- [ ] **Step 4: Add canonical upsert repository**

Repository upserts:

- groups by `vk_group_id`;
- authors by `vk_author_id`;
- posts by `(vk_owner_id, vk_post_id)`;
- comments by `(vk_owner_id, vk_post_id, vk_comment_id)`.

- [ ] **Step 5: Add ingestion service**

For `selected` tasks, execute only task `group_ids`.

For `all`, if no configured group source exists, fail task with:

```text
No group source configured for scope=all
```

- [ ] **Step 6: Add tests and commit**

Run:

```bash
pytest services/vk-service/tests/test_ingestion.py -q
```

Commit:

```bash
git add services/vk-service
git commit -m "feat: добавлено vk ingestion хранилище"
```

---

## Task 5: PR-019 VK Outbox Publisher

**Files:**
- Create: `services/vk-service/app/modules/outbox/service.py`
- Create: `services/vk-service/app/modules/outbox/repository.py`
- Create: `services/vk-service/app/modules/outbox/publisher.py`
- Modify: `services/vk-service/app/modules/ingestion/service.py`
- Test: `services/vk-service/tests/test_vk_outbox.py`

- [ ] **Step 1: Add outbox service**

Use same envelope shape as `tasks-service`, topic `parsevk.vk.events`.
Add `dedupe_key` support to the local outbox model/service. For collected domain
events use deterministic keys:

```text
vk.group_collected:{vk_group_id}
vk.author_collected:{vk_author_id}
vk.post_collected:{vk_owner_id}:{vk_post_id}
vk.comment_collected:{vk_owner_id}:{vk_post_id}:{vk_comment_id}
vk.task_completed:{task_id}:{run_id}
vk.task_failed:{task_id}:{run_id}
```

Progress events may omit `dedupe_key` or use a coarse key only if the service
intentionally wants to collapse updates. Do not use a unique dedupe key that
prevents later progress updates for the same task.

Event types:

```text
vk.group_collected
vk.post_collected
vk.comment_collected
vk.author_collected
vk.task_progress_updated
vk.task_completed
vk.task_failed
```

- [ ] **Step 2: Add Kafka key rules**

```python
def kafka_key_for_event(event_type: str, payload: dict, aggregate_id: str) -> str:
    if event_type in {"vk.task_progress_updated", "vk.task_completed", "vk.task_failed"}:
        return str(payload["taskId"])
    return str(aggregate_id)
```

- [ ] **Step 3: Emit events after canonical upserts**

Ingestion emits collected events through local outbox, not direct Kafka publish
inside request/task transaction.

- [ ] **Step 4: Run tests and commit**

```bash
pytest services/vk-service/tests/test_vk_outbox.py services/vk-service/tests/test_ingestion.py -q
git add services/vk-service
git commit -m "feat: добавлен outbox vk events"
```

---

## Task 6: PR-020 Content Service Skeleton and Projection Consumer

**Files:**
- Create: `services/content-service/pyproject.toml`
- Create: `services/content-service/Dockerfile`
- Create: `services/content-service/app/main.py`
- Create: `services/content-service/app/core/config.py`
- Create: `services/content-service/app/db/models.py`
- Create: `services/content-service/app/db/session.py`
- Create: `services/content-service/alembic.ini`
- Create: `services/content-service/alembic/env.py`
- Create: `services/content-service/alembic/versions/20260508_0001_create_content_tables.py`
- Create: `services/content-service/app/modules/projections/consumer.py`
- Create: `services/content-service/app/modules/projections/service.py`
- Test: `services/content-service/tests/test_projection_consumer.py`

- [ ] **Step 1: Create service skeleton**

Follow `tasks-service` package/Dockerfile/test path pattern. Prefix env vars
with `CONTENT_`.

`pyproject.toml` dependencies must include:

```toml
dependencies = [
  "aiokafka>=0.14,<1.0",
  "alembic>=1.13",
  "asyncpg>=0.29",
  "fastapi>=0.115",
  "pydantic-settings>=2.4",
  "sqlalchemy[asyncio]>=2.0",
  "uvicorn[standard]>=0.30",
]
```

`app/main.py` must use lifespan for projection consumer startup/shutdown. Do not
use deprecated startup/shutdown event decorators.

- [ ] **Step 2: Add content DB models**

Implement:

- `ContentGroup`
- `ContentAuthor`
- `ContentPost`
- `ContentComment`
- `ProcessedEvent`

Use unique `external_key` for posts/comments.
`ProcessedEvent` must use `UNIQUE (consumer_name, event_id)`, not only
`UNIQUE (event_id)`, so multiple consumers can track the same Kafka event
independently.

- [ ] **Step 3: Add projection consumer**

Projection behavior:

```text
vk.group_collected -> upsert content_groups
vk.author_collected -> upsert content_authors
vk.post_collected -> upsert content_posts
vk.comment_collected -> upsert content_comments and increment/update post comments_count
duplicate event_id -> no-op
```

Duplicate means `(consumer_name, event_id)` already exists. Upserts still use
domain keys such as `external_key`, so replayed events cannot duplicate rows even
if the processed-event write is retried.

- [ ] **Step 4: Run tests and commit**

```bash
pytest services/content-service/tests -q
git add services/content-service
git commit -m "feat: добавлен content service projection"
```

---

## Task 7: PR-021 Content Read API and Gateway Routes

**Files:**
- Create: `services/content-service/app/modules/content/router.py`
- Create: `services/content-service/app/modules/content/repository.py`
- Create: `services/content-service/app/modules/content/schemas.py`
- Modify: `services/content-service/app/main.py`
- Create: `services/api-gateway/app/clients/content/client.py`
- Create: `services/api-gateway/app/modules/content/router.py`
- Create: `services/api-gateway/app/modules/content/service.py`
- Modify: `services/api-gateway/app/core/config.py`
- Modify: `services/api-gateway/app/main.py`
- Test: `services/content-service/tests/test_content_api.py`
- Test: `services/api-gateway/tests/test_content_gateway.py`

- [ ] **Step 1: Add content internal API**

Routes:

```text
GET /internal/content/groups
GET /internal/content/groups/{vk_group_id}
GET /internal/content/posts
GET /internal/content/posts/{external_key}
GET /internal/content/comments
GET /internal/content/authors
GET /internal/content/authors/{vk_author_id}
```

All routes require `X-Internal-Service-Token`.

- [ ] **Step 2: Add pagination**

Defaults:

```text
page = 1
limit = 20
limit <= 100
ORDER BY date DESC NULLS LAST, id DESC
```

- [ ] **Step 3: Add gateway BFF routes**

Public routes:

```text
GET /api/v1/content/groups
GET /api/v1/content/groups/{vk_group_id}
GET /api/v1/content/posts
GET /api/v1/content/posts/{external_key}
GET /api/v1/content/comments
GET /api/v1/content/authors
GET /api/v1/content/authors/{vk_author_id}
```

Gateway validates access token and forwards `X-User-ID`.

- [ ] **Step 4: Run tests and commit**

```bash
pytest services/content-service/tests services/api-gateway/tests/test_content_gateway.py -q
git add services/content-service services/api-gateway
git commit -m "feat: добавлен content api через gateway"
```

---

## Task 8: PR-022 Docker Compose, Smoke, Docs

**Files:**
- Modify: `docker-compose.yml`
- Modify: `docker-compose.deploy.yml`
- Modify: `.env.example`
- Modify: `docs/FASTAPI_MICROSERVICES.md`
- Create: `scripts/smoke-fastapi-vk-content.sh`

- [ ] **Step 1: Add Compose services**

Add local services:

```text
vk-db
vk-migrate
vk-service
content-db
content-migrate
content-service
```

Wire:

```text
vk-service depends on vk-migrate, tasks-service, kafka
content-service depends on content-migrate, kafka
api-gateway depends on content-service
```

- [ ] **Step 2: Add env example**

Add:

```text
VK_SERVICE_POSTGRES_USER=vk
VK_SERVICE_POSTGRES_PASSWORD=vk_dev_password_change_me
VK_SERVICE_POSTGRES_DB=vk
VK_SERVICE_DATABASE_URL=postgresql+asyncpg://vk:vk_dev_password_change_me@vk-db:5432/vk
VK_SERVICE_KAFKA_CONSUMER_ENABLED=true
VK_SERVICE_USE_FAKE_VK_ADAPTER=true
VK_SERVICE_VK_TOKEN=
CONTENT_POSTGRES_USER=content
CONTENT_POSTGRES_PASSWORD=content_dev_password_change_me
CONTENT_POSTGRES_DB=content
CONTENT_DATABASE_URL=postgresql+asyncpg://content:content_dev_password_change_me@content-db:5432/content
CONTENT_KAFKA_CONSUMER_ENABLED=true
```

Compose must use the `*_POSTGRES_*` variables for Postgres containers and the
`*_DATABASE_URL` variables for application containers. Do not construct one set
while the app reads only the other.

- [ ] **Step 3: Add smoke script**

Smoke flow:

```text
login
create selected task with groupIds [1]
publish/consume task.created
vk-service marks task running
vk-service fake adapter writes group/post/comment
vk-service publishes vk.*
content-service projection stores post/comment
gateway GET /api/v1/content/posts returns at least one post
task detail is done
```

Smoke fallback rule:

If local compose has `tasks-service` outbox publishing disabled or Kafka is not
receiving `task.created`, the smoke script may inject the same envelope directly
into `parsevk.tasks.events` through a small producer command/container. This is
only a local smoke fallback; production flow must use `tasks-service` outbox.
The injected envelope must use the real `taskId` returned by create-task and a
stable `event_id`, so `runId = event_id` remains deterministic.

- [ ] **Step 4: Run final verification**

```bash
pytest libs/py/common/tests services/api-gateway/tests services/identity-service/tests services/tasks-service/tests services/vk-service/tests services/content-service/tests -q
npm --prefix front test -- tasks
docker compose config --quiet
docker compose build vk-service content-service api-gateway
docker compose up -d identity-db identity-migrate identity-seed-admin identity-service tasks-db tasks-migrate tasks-service vk-db vk-migrate vk-service content-db content-migrate content-service api-gateway
IDENTITY_ADMIN_PASSWORD=admin-change-me scripts/smoke-fastapi-vk-content.sh
```

- [ ] **Step 5: Commit PR-022**

```bash
git add docker-compose.yml docker-compose.deploy.yml .env.example docs/FASTAPI_MICROSERVICES.md scripts/smoke-fastapi-vk-content.sh
git commit -m "chore: добавлен smoke для vk и content сервисов"
```

---

## Final Verification Checklist

- [ ] `vk-service` is the only new service using external VK API.
- [ ] `vk-service` owns `vk-db`.
- [ ] `content-service` owns `content-db`.
- [ ] `content-service` does not read `vk-db` directly.
- [ ] `content-service` read API is only exposed through `api-gateway`.
- [ ] Kafka event types have no `.v1` suffix.
- [ ] Execution callbacks are idempotent by stable `runId`.
- [ ] Consumers are idempotent by `(consumer_name, event_id)`.
- [ ] Domain writes are idempotent by natural external keys.
- [ ] Outbox domain events use deterministic `dedupe_key`.
- [ ] Kafka consumers/publishers are managed through FastAPI lifespan.
- [ ] `tasks-service` remains task status/progress source of truth.
- [ ] Compose env provides both DB container credentials and service
      `*_DATABASE_URL` values.
- [ ] No tokens/secrets appear in Kafka payloads, outbox rows, or logs.
- [ ] Docker smoke proves create task -> VK ingestion -> content read -> task done.
- [ ] NestJS `api/` remains present as fallback.
