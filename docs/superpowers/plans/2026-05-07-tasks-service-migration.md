# Tasks Service Migration Implementation Plan

> Status note, 2026-05-22: this checklist is stale. The factual migration
> status is tracked in `docs/BACKEND_MIGRATION_STATUS.md`; use this plan as
> historical implementation context, not as the current source of truth.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a FastAPI `tasks-service` that owns per-user tasks, audit log, automation settings, and task outbox while keeping VK execution in the later `vk-service` slice.

**Architecture:** `api-gateway` remains the public BFF. It validates access tokens, extracts user id, and forwards tasks requests to internal `tasks-service` with trusted headers. `tasks-service` owns a separate PostgreSQL DB, SQLAlchemy models, Alembic migrations, per-user automation settings, task audit rows, and outbox events.

**Tech Stack:** FastAPI, Pydantic v2, SQLAlchemy 2 async, Alembic, PostgreSQL, pytest, httpx ASGITransport, existing `libs/py/common` event/error helpers, Docker Compose.

---

## Source Spec

Implement this plan against:

```text
docs/superpowers/specs/2026-05-07-tasks-service-migration-design.md
```

Do not move VK parsing execution in this plan. New tasks may remain `pending`.

## PR Slices

1. `PR-008`: `tasks-service` skeleton, DB, Alembic, health.
2. `PR-009`: task models/repository/service/router with owner scoping.
3. `PR-010`: automation settings and manual run.
4. `PR-011`: task outbox path and publisher.
5. `PR-012`: gateway tasks BFF routes and typed client.
6. `PR-013`: frontend tasks/automation API switch to gateway.
7. `PR-014`: Docker Compose, smoke script, docs, final checks.

Keep commits split by slice. Do not mix frontend migration with service DB work.

## File Map

Create:

```text
services/tasks-service/
  Dockerfile
  pyproject.toml
  alembic.ini
  alembic/env.py
  alembic/versions/20260507_0001_create_tasks_tables.py
  app/__init__.py
  app/main.py
  app/core/config.py
  app/core/logging.py
  app/core/security.py
  app/db/base.py
  app/db/models.py
  app/db/session.py
  app/modules/tasks/router.py
  app/modules/tasks/schemas.py
  app/modules/tasks/service.py
  app/modules/tasks/repository.py
  app/modules/tasks/mapper.py
  app/modules/automation/router.py
  app/modules/automation/schemas.py
  app/modules/automation/service.py
  app/modules/automation/repository.py
  app/modules/outbox/repository.py
  app/modules/outbox/service.py
  app/modules/outbox/publisher.py
  tests/_service_path.py
  tests/test_health.py
  tests/test_task_models.py
  tests/test_tasks_api.py
  tests/test_automation_api.py
  tests/test_outbox.py
```

Modify:

```text
services/api-gateway/app/core/config.py
services/api-gateway/app/main.py
services/api-gateway/app/clients/tasks/client.py
services/api-gateway/app/clients/tasks/schemas.py
services/api-gateway/app/modules/tasks/router.py
services/api-gateway/app/modules/tasks/service.py
services/api-gateway/tests/test_tasks_gateway.py
front/src/modules/tasks/api/tasks.api.ts
front/src/modules/settings/api/taskAutomation.api.ts
docker-compose.yml
docker-compose.deploy.yml
.env.example
docs/FASTAPI_MICROSERVICES.md
scripts/smoke-fastapi-tasks.sh
```

If `services/api-gateway/app/clients/tasks/*` or `modules/tasks/*` do not exist, create them.

---

## Task 1: PR-008 Tasks Service Skeleton, DB, Alembic, Health

**Files:**
- Create: `services/tasks-service/pyproject.toml`
- Create: `services/tasks-service/Dockerfile`
- Create: `services/tasks-service/app/main.py`
- Create: `services/tasks-service/app/core/config.py`
- Create: `services/tasks-service/app/core/security.py`
- Create: `services/tasks-service/app/db/base.py`
- Create: `services/tasks-service/app/db/models.py`
- Create: `services/tasks-service/app/db/session.py`
- Create: `services/tasks-service/alembic.ini`
- Create: `services/tasks-service/alembic/env.py`
- Create: `services/tasks-service/alembic/versions/20260507_0001_create_tasks_tables.py`
- Create: `services/tasks-service/tests/_service_path.py`
- Create: `services/tasks-service/tests/test_health.py`
- Create: `services/tasks-service/tests/test_task_models.py`

- [ ] **Step 1: Create package metadata**

Add `services/tasks-service/pyproject.toml`:

```toml
[project]
name = "parsevk-tasks-service"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
  "fastapi>=0.115",
  "uvicorn[standard]>=0.30",
  "pydantic-settings>=2.4",
  "SQLAlchemy[asyncio]>=2.0",
  "asyncpg>=0.29",
  "alembic>=1.13",
  "aiokafka>=0.11",
]

[project.optional-dependencies]
test = ["httpx>=0.27", "pytest>=8.3", "pytest-asyncio>=0.23"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["app"]
```

- [ ] **Step 2: Create Dockerfile**

Add `services/tasks-service/Dockerfile`:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

COPY libs/py/common ./libs/py/common
COPY services/tasks-service ./services/tasks-service

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir ./libs/py/common ./services/tasks-service

WORKDIR /app/services/tasks-service

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 3: Create settings**

Add `services/tasks-service/app/core/config.py`:

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="TASKS_", extra="ignore")

    app_name: str = "parseVK Tasks Service"
    database_url: str = "postgresql+asyncpg://tasks:tasks@tasks-db:5432/tasks"
    internal_service_token: str = "dev-internal-token"
    kafka_bootstrap_servers: str = "kafka:9092"
    kafka_topic_tasks: str = "parsevk.tasks.events"
    outbox_publish_enabled: bool = False


settings = Settings()
```

- [ ] **Step 4: Create internal security helpers**

Add `services/tasks-service/app/core/security.py`:

```python
from fastapi import Header, HTTPException, status

from app.core.config import settings


async def require_internal_token(
    x_internal_service_token: str | None = Header(default=None, alias="X-Internal-Service-Token"),
) -> None:
    if not x_internal_service_token or x_internal_service_token != settings.internal_service_token:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


async def require_owner_user_id(
    x_user_id: str | None = Header(default=None, alias="X-User-ID"),
) -> str:
    if not x_user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing X-User-ID")
    return x_user_id
```

- [ ] **Step 5: Create SQLAlchemy base and session**

Add `services/tasks-service/app/db/base.py`:

```python
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
```

Add `services/tasks-service/app/db/session.py`:

```python
from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

engine = create_async_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_session() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

- [ ] **Step 6: Create DB models**

Add `services/tasks-service/app/db/models.py` with these classes:

```python
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = (
        CheckConstraint("status IN ('pending', 'running', 'done', 'failed', 'cancelled')", name="ck_tasks_status"),
        CheckConstraint("progress >= 0 AND progress <= 1", name="ck_tasks_progress_range"),
        CheckConstraint("total_items >= 0", name="ck_tasks_total_non_negative"),
        CheckConstraint("processed_items >= 0", name="ck_tasks_processed_non_negative"),
        CheckConstraint("processed_items <= total_items", name="ck_tasks_processed_lte_total"),
        CheckConstraint("post_limit IS NULL OR post_limit BETWEEN 1 AND 100", name="ck_tasks_post_limit_range"),
        CheckConstraint("scope IS NULL OR scope IN ('all', 'selected')", name="ck_tasks_scope"),
        CheckConstraint("mode IS NULL OR mode IN ('recent_posts', 'recheck_group')", name="ck_tasks_mode"),
        CheckConstraint("source IN ('manual', 'automation')", name="ck_tasks_source"),
        Index("ix_tasks_owner_created", "owner_user_id", "created_at", "id"),
        Index("ix_tasks_owner_status", "owner_user_id", "status"),
        Index("ix_tasks_owner_source_status", "owner_user_id", "source", "status"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    owner_user_id: Mapped[str] = mapped_column(String(128), nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    scope: Mapped[str | None] = mapped_column(String(32), nullable=True)
    mode: Mapped[str | None] = mapped_column(String(64), nullable=True)
    group_ids: Mapped[list[int]] = mapped_column(ARRAY(BigInteger), nullable=False, default=list)
    post_limit: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source: Mapped[str] = mapped_column(String(32), nullable=False, default="manual")
    total_items: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    processed_items: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    progress: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    stats: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    skipped_groups_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    audit_logs: Mapped[list["TaskAuditLog"]] = relationship(back_populates="task")


class TaskAuditLog(Base):
    __tablename__ = "task_audit_logs"
    __table_args__ = (
        Index("ix_task_audit_logs_owner_created", "owner_user_id", "created_at"),
        Index("ix_task_audit_logs_task_created", "task_id", "created_at"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    owner_user_id: Mapped[str] = mapped_column(String(128), nullable=False)
    aggregate_type: Mapped[str] = mapped_column(String(128), nullable=False, default="task")
    aggregate_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    task_id: Mapped[int | None] = mapped_column(ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    event_type: Mapped[str] = mapped_column(String(255), nullable=False)
    event_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)

    task: Mapped[Task | None] = relationship(back_populates="audit_logs")


class TaskAutomationSettings(Base):
    __tablename__ = "task_automation_settings"
    __table_args__ = (
        UniqueConstraint("owner_user_id", name="uq_task_automation_settings_owner"),
        CheckConstraint("run_hour BETWEEN 0 AND 23", name="ck_task_automation_run_hour"),
        CheckConstraint("run_minute BETWEEN 0 AND 59", name="ck_task_automation_run_minute"),
        CheckConstraint("post_limit BETWEEN 1 AND 100", name="ck_task_automation_post_limit"),
        CheckConstraint("timezone_offset_minutes BETWEEN -720 AND 840", name="ck_task_automation_timezone_offset"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    owner_user_id: Mapped[str] = mapped_column(String(128), nullable=False)
    enabled: Mapped[bool] = mapped_column(nullable=False, default=False)
    run_hour: Mapped[int] = mapped_column(Integer, nullable=False, default=9)
    run_minute: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    post_limit: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    timezone_offset_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)


class OutboxEvent(Base):
    __tablename__ = "outbox_events"
    __table_args__ = (
        Index("ix_outbox_events_status_next_attempt", "status", "next_attempt_at"),
        Index("ix_outbox_events_aggregate", "aggregate_type", "aggregate_id"),
    )

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    event_type: Mapped[str] = mapped_column(String(255), nullable=False)
    event_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    aggregate_type: Mapped[str] = mapped_column(String(128), nullable=False)
    aggregate_id: Mapped[str] = mapped_column(String(128), nullable=False)
    correlation_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    next_attempt_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    locked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
```

- [ ] **Step 7: Create Alembic config and migration**

Add `services/tasks-service/alembic.ini`:

```ini
[alembic]
script_location = alembic
prepend_sys_path = .

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
```

Add `services/tasks-service/alembic/env.py`:

```python
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.core.config import settings
from app.db.base import Base
from app.db import models  # noqa: F401

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    import asyncio

    asyncio.run(run_async_migrations())


run_migrations_online()
```

Create migration `services/tasks-service/alembic/versions/20260507_0001_create_tasks_tables.py` from the model schema. Required details:

```python
revision = "20260507_0001"
down_revision = None
branch_labels = None
depends_on = None
```

The migration must create `tasks`, `task_audit_logs`, `task_automation_settings`, and `outbox_events` with the constraints and indexes listed in Step 6.

- [ ] **Step 8: Create FastAPI app and health**

Add `services/tasks-service/app/main.py`:

```python
from fastapi import FastAPI


def create_app() -> FastAPI:
    app = FastAPI(title="parseVK Tasks Service")

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "UP"}

    return app


app = create_app()
```

- [ ] **Step 9: Add health test**

Add `services/tasks-service/tests/_service_path.py`:

```python
import sys
from pathlib import Path


def use_service_path() -> None:
    service_root = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(service_root))
    for module_name in list(sys.modules):
        if module_name == "app" or module_name.startswith("app."):
            del sys.modules[module_name]
```

Add `services/tasks-service/tests/test_health.py`:

```python
import sys
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.main import create_app


@pytest.mark.asyncio
async def test_health_returns_up():
    app = create_app()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "UP"}
```

- [ ] **Step 10: Add model metadata test**

Add `services/tasks-service/tests/test_task_models.py`:

```python
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.db.models import OutboxEvent, Task, TaskAuditLog, TaskAutomationSettings


def test_model_tables_exist():
    assert Task.__tablename__ == "tasks"
    assert TaskAuditLog.__tablename__ == "task_audit_logs"
    assert TaskAutomationSettings.__tablename__ == "task_automation_settings"
    assert OutboxEvent.__tablename__ == "outbox_events"


def test_task_has_owner_source_and_status_columns():
    columns = Task.__table__.columns
    assert "owner_user_id" in columns
    assert "source" in columns
    assert "status" in columns
    assert "completed" not in columns
```

- [ ] **Step 11: Run skeleton tests**

Run:

```bash
pytest services/tasks-service/tests/test_health.py services/tasks-service/tests/test_task_models.py -q
```

Expected:

```text
3 passed
```

- [ ] **Step 12: Commit PR-008**

```bash
git add services/tasks-service
git commit -m "feat: добавлен каркас tasks service"
```

---

## Task 2: PR-009 Tasks API With Owner Scoping

**Files:**
- Create: `services/tasks-service/app/modules/tasks/schemas.py`
- Create: `services/tasks-service/app/modules/tasks/mapper.py`
- Create: `services/tasks-service/app/modules/tasks/repository.py`
- Create: `services/tasks-service/app/modules/tasks/service.py`
- Create: `services/tasks-service/app/modules/tasks/router.py`
- Modify: `services/tasks-service/app/main.py`
- Test: `services/tasks-service/tests/test_tasks_api.py`

- [ ] **Step 1: Write API tests first**

Add `services/tasks-service/tests/test_tasks_api.py`:

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


class FakeTasksService:
    def __init__(self):
        self.created = []
        self.deleted = []

    async def create_parse_task(self, owner_user_id, payload, request_id=None, correlation_id=None):
        group_ids = [] if payload.scope == "all" else payload.group_ids
        task = {
            "id": 1,
            "title": f"VK parse: {payload.scope} / {payload.mode}",
            "description": {"scope": payload.scope, "mode": payload.mode, "groupIds": group_ids, "postLimit": payload.post_limit},
            "completed": False,
            "totalItems": 0,
            "processedItems": 0,
            "progress": 0,
            "status": "pending",
            "scope": payload.scope,
            "mode": payload.mode,
            "groupIds": group_ids,
            "postLimit": payload.post_limit,
            "source": "manual",
            "stats": None,
            "error": None,
            "skippedGroupsMessage": None,
            "createdAt": "2026-05-07T12:00:00Z",
            "updatedAt": "2026-05-07T12:00:00Z",
        }
        self.created.append((owner_user_id, task))
        return task

    async def list_tasks(self, owner_user_id, page, limit):
        return {"tasks": [], "total": 0, "page": page, "limit": limit, "totalPages": 0, "hasMore": False}

    async def get_task(self, owner_user_id, task_id):
        if owner_user_id == "other":
            return None
        return await self.create_parse_task(owner_user_id, type("Payload", (), {"scope": "all", "mode": "recent_posts", "group_ids": [], "post_limit": 10})())

    async def get_audit_log(self, owner_user_id, task_id):
        return []

    async def resume_task(self, owner_user_id, task_id):
        return await self.get_task(owner_user_id, task_id)

    async def check_task(self, owner_user_id, task_id):
        return await self.get_task(owner_user_id, task_id)

    async def delete_task(self, owner_user_id, task_id):
        self.deleted.append((owner_user_id, task_id))


@pytest.fixture
def fake_service():
    return FakeTasksService()


@pytest.fixture
def app(fake_service):
    app = create_app()
    app.dependency_overrides[get_tasks_service] = lambda: fake_service
    return app


def headers(user_id="user-1"):
    return {"X-Internal-Service-Token": "dev-internal-token", "X-User-ID": user_id}


@pytest.mark.asyncio
async def test_create_scope_all_ignores_group_ids(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/internal/tasks/parse",
            headers=headers(),
            json={"scope": "all", "groupIds": [1, 2], "postLimit": 10, "mode": "recent_posts"},
        )

    assert response.status_code == 200
    assert response.json()["groupIds"] == []


@pytest.mark.asyncio
async def test_selected_scope_requires_group_ids(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/internal/tasks/parse",
            headers=headers(),
            json={"scope": "selected", "groupIds": [], "postLimit": 10, "mode": "recent_posts"},
        )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_uses_pagination_defaults(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/internal/tasks", headers=headers())

    assert response.status_code == 200
    assert response.json() == {"tasks": [], "total": 0, "page": 1, "limit": 20, "totalPages": 0, "hasMore": False}


@pytest.mark.asyncio
async def test_missing_user_header_returns_400(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/internal/tasks", headers={"X-Internal-Service-Token": "dev-internal-token"})

    assert response.status_code == 400


@pytest.mark.asyncio
async def test_wrong_internal_token_returns_403(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/internal/tasks", headers={"X-Internal-Service-Token": "wrong", "X-User-ID": "user-1"})

    assert response.status_code == 403
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
pytest services/tasks-service/tests/test_tasks_api.py -q
```

Expected: import failure for `app.modules.tasks.router` or 404 for `/internal/tasks`.

- [ ] **Step 3: Add schemas**

Add `services/tasks-service/app/modules/tasks/schemas.py`:

```python
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

Scope = Literal["all", "selected"]
Mode = Literal["recent_posts", "recheck_group"]
Status = Literal["pending", "running", "done", "failed", "cancelled"]
Source = Literal["manual", "automation"]


class CreateParseTaskRequest(BaseModel):
    scope: Scope = "all"
    group_ids: list[int] = Field(default_factory=list, alias="groupIds")
    post_limit: int = Field(default=10, ge=1, le=100, alias="postLimit")
    mode: Mode = "recent_posts"

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("group_ids")
    @classmethod
    def validate_group_ids(cls, value: list[int]) -> list[int]:
        return [int(item) for item in value]

    @field_validator("group_ids")
    @classmethod
    def require_selected_group_ids(cls, value: list[int], info):
        scope = info.data.get("scope", "all")
        if scope == "selected" and not value:
            raise ValueError("groupIds is required for selected scope")
        if scope == "all":
            return []
        return value


class TaskResponse(BaseModel):
    id: int
    title: str
    description: dict[str, Any] | None
    completed: bool
    total_items: int = Field(alias="totalItems")
    processed_items: int = Field(alias="processedItems")
    progress: float
    status: Status
    scope: Scope | None
    mode: Mode | None
    group_ids: list[int] = Field(alias="groupIds")
    post_limit: int | None = Field(alias="postLimit")
    source: Source
    stats: dict[str, Any] | None
    error: str | None
    skipped_groups_message: str | None = Field(alias="skippedGroupsMessage")
    created_at: datetime | str = Field(alias="createdAt")
    updated_at: datetime | str = Field(alias="updatedAt")

    model_config = ConfigDict(populate_by_name=True)


class TaskListResponse(BaseModel):
    tasks: list[TaskResponse]
    total: int
    page: int
    limit: int
    total_pages: int = Field(alias="totalPages")
    has_more: bool = Field(alias="hasMore")

    model_config = ConfigDict(populate_by_name=True)


class TaskAuditLogResponse(BaseModel):
    id: int
    task_id: int | None = Field(alias="taskId")
    aggregate_type: str = Field(alias="aggregateType")
    aggregate_id: str | None = Field(alias="aggregateId")
    event_type: str = Field(alias="eventType")
    event_data: dict[str, Any] | None = Field(alias="eventData")
    created_at: datetime | str = Field(alias="createdAt")

    model_config = ConfigDict(populate_by_name=True)
```

- [ ] **Step 4: Add mapper**

Add `services/tasks-service/app/modules/tasks/mapper.py`:

```python
from app.db.models import Task, TaskAuditLog


def task_to_response(task: Task) -> dict:
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "completed": task.status == "done",
        "totalItems": task.total_items,
        "processedItems": task.processed_items,
        "progress": task.progress,
        "status": task.status,
        "scope": task.scope,
        "mode": task.mode,
        "groupIds": task.group_ids,
        "postLimit": task.post_limit,
        "source": task.source,
        "stats": task.stats,
        "error": task.error,
        "skippedGroupsMessage": task.skipped_groups_message,
        "createdAt": task.created_at.isoformat(),
        "updatedAt": task.updated_at.isoformat(),
    }


def audit_to_response(audit: TaskAuditLog) -> dict:
    return {
        "id": audit.id,
        "taskId": audit.task_id,
        "aggregateType": audit.aggregate_type,
        "aggregateId": audit.aggregate_id,
        "eventType": audit.event_type,
        "eventData": audit.event_data,
        "createdAt": audit.created_at.isoformat(),
    }
```

- [ ] **Step 5: Add repository**

Add `services/tasks-service/app/modules/tasks/repository.py`:

```python
from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Task, TaskAuditLog, utcnow


class TasksRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_task(self, task: Task) -> Task:
        self.session.add(task)
        await self.session.flush()
        await self.session.refresh(task)
        return task

    async def add_audit(self, audit: TaskAuditLog) -> TaskAuditLog:
        self.session.add(audit)
        await self.session.flush()
        await self.session.refresh(audit)
        return audit

    async def list_tasks(self, owner_user_id: str, *, page: int, limit: int) -> tuple[list[Task], int]:
        offset = (page - 1) * limit
        base: Select = select(Task).where(Task.owner_user_id == owner_user_id)
        total = await self.session.scalar(select(func.count()).select_from(base.subquery()))
        result = await self.session.scalars(
            base.order_by(Task.created_at.desc(), Task.id.desc()).offset(offset).limit(limit)
        )
        return list(result), int(total or 0)

    async def get_task(self, owner_user_id: str, task_id: int) -> Task | None:
        return await self.session.scalar(
            select(Task).where(Task.owner_user_id == owner_user_id, Task.id == task_id)
        )

    async def list_audit(self, owner_user_id: str, task_id: int) -> list[TaskAuditLog]:
        result = await self.session.scalars(
            select(TaskAuditLog)
            .where(TaskAuditLog.owner_user_id == owner_user_id, TaskAuditLog.task_id == task_id)
            .order_by(TaskAuditLog.created_at.asc(), TaskAuditLog.id.asc())
        )
        return list(result)

    async def delete_task(self, task: Task) -> None:
        await self.session.delete(task)

    async def touch_task(self, task: Task) -> Task:
        task.updated_at = utcnow()
        await self.session.flush()
        await self.session.refresh(task)
        return task
```

- [ ] **Step 6: Add service**

Add `services/tasks-service/app/modules/tasks/service.py`:

```python
from math import ceil

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Task, TaskAuditLog
from app.modules.tasks.mapper import audit_to_response, task_to_response
from app.modules.tasks.repository import TasksRepository
from app.modules.tasks.schemas import CreateParseTaskRequest


class TasksService:
    def __init__(self, session: AsyncSession):
        self.repository = TasksRepository(session)

    async def create_parse_task(
        self,
        owner_user_id: str,
        payload: CreateParseTaskRequest,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        group_ids = [] if payload.scope == "all" else payload.group_ids
        title = f"VK parse: {payload.scope} / {payload.mode}"
        description = {"scope": payload.scope, "mode": payload.mode, "groupIds": group_ids, "postLimit": payload.post_limit}
        task = await self.repository.create_task(
            Task(
                owner_user_id=owner_user_id,
                title=title,
                description=description,
                status="pending",
                scope=payload.scope,
                mode=payload.mode,
                group_ids=group_ids,
                post_limit=payload.post_limit,
                source="manual",
            )
        )
        await self.repository.add_audit(
            TaskAuditLog(
                owner_user_id=owner_user_id,
                aggregate_type="task",
                aggregate_id=str(task.id),
                task_id=task.id,
                event_type="task.created",
                event_data={"taskId": str(task.id), "source": "manual"},
            )
        )
        return task_to_response(task)

    async def list_tasks(self, owner_user_id: str, page: int, limit: int) -> dict:
        tasks, total = await self.repository.list_tasks(owner_user_id, page=page, limit=limit)
        total_pages = ceil(total / limit) if total else 0
        return {
            "tasks": [task_to_response(task) for task in tasks],
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": total_pages,
            "hasMore": page < total_pages,
        }

    async def get_task(self, owner_user_id: str, task_id: int) -> dict | None:
        task = await self.repository.get_task(owner_user_id, task_id)
        return task_to_response(task) if task else None

    async def get_audit_log(self, owner_user_id: str, task_id: int) -> list[dict]:
        task = await self.repository.get_task(owner_user_id, task_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        rows = await self.repository.list_audit(owner_user_id, task_id)
        return [audit_to_response(row) for row in rows]

    async def resume_task(self, owner_user_id: str, task_id: int) -> dict | None:
        task = await self.repository.get_task(owner_user_id, task_id)
        if not task:
            return None
        if task.status in {"running", "done"}:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Invalid task transition")
        task.status = "pending"
        task.error = None
        await self.repository.add_audit(
            TaskAuditLog(owner_user_id=owner_user_id, aggregate_type="task", aggregate_id=str(task.id), task_id=task.id, event_type="task.resumed", event_data={"taskId": str(task.id)})
        )
        task = await self.repository.touch_task(task)
        return task_to_response(task)

    async def check_task(self, owner_user_id: str, task_id: int) -> dict | None:
        task = await self.repository.get_task(owner_user_id, task_id)
        if not task:
            return None
        await self.repository.add_audit(
            TaskAuditLog(owner_user_id=owner_user_id, aggregate_type="task", aggregate_id=str(task.id), task_id=task.id, event_type="task.checked", event_data={"taskId": str(task.id)})
        )
        return task_to_response(task)

    async def delete_task(self, owner_user_id: str, task_id: int) -> None:
        task = await self.repository.get_task(owner_user_id, task_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        if task.status == "running":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cannot delete running task")
        snapshot = {
            "taskId": str(task.id),
            "status": task.status,
            "scope": task.scope,
            "mode": task.mode,
            "groupIds": task.group_ids,
            "postLimit": task.post_limit,
        }
        await self.repository.add_audit(
            TaskAuditLog(owner_user_id=owner_user_id, aggregate_type="task", aggregate_id=str(task.id), task_id=task.id, event_type="task.deleted", event_data={"taskSnapshot": snapshot})
        )
        await self.repository.delete_task(task)
```

- [ ] **Step 7: Add router**

Add `services/tasks-service/app/modules/tasks/router.py`:

```python
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_internal_token, require_owner_user_id
from app.db.session import get_session
from app.modules.tasks.schemas import CreateParseTaskRequest
from app.modules.tasks.service import TasksService

router = APIRouter(
    prefix="/internal/tasks",
    tags=["tasks"],
    dependencies=[Depends(require_internal_token)],
)


async def get_tasks_service(session: AsyncSession = Depends(get_session)) -> TasksService:
    return TasksService(session)


@router.post("/parse")
async def create_parse_task(
    payload: CreateParseTaskRequest,
    owner_user_id: Annotated[str, Depends(require_owner_user_id)],
    service: TasksService = Depends(get_tasks_service),
    x_request_id: str | None = Header(default=None, alias="X-Request-ID"),
    x_correlation_id: str | None = Header(default=None, alias="X-Correlation-ID"),
):
    return await service.create_parse_task(owner_user_id, payload, request_id=x_request_id, correlation_id=x_correlation_id)


@router.get("")
async def list_tasks(
    owner_user_id: Annotated[str, Depends(require_owner_user_id)],
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    service: TasksService = Depends(get_tasks_service),
):
    return await service.list_tasks(owner_user_id, page, limit)


@router.get("/{task_id}")
async def get_task(task_id: int, owner_user_id: Annotated[str, Depends(require_owner_user_id)], service: TasksService = Depends(get_tasks_service)):
    task = await service.get_task(owner_user_id, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


@router.get("/{task_id}/audit-log")
async def get_task_audit_log(task_id: int, owner_user_id: Annotated[str, Depends(require_owner_user_id)], service: TasksService = Depends(get_tasks_service)):
    return await service.get_audit_log(owner_user_id, task_id)


@router.post("/{task_id}/resume")
async def resume_task(task_id: int, owner_user_id: Annotated[str, Depends(require_owner_user_id)], service: TasksService = Depends(get_tasks_service)):
    task = await service.resume_task(owner_user_id, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


@router.post("/{task_id}/check")
async def check_task(task_id: int, owner_user_id: Annotated[str, Depends(require_owner_user_id)], service: TasksService = Depends(get_tasks_service)):
    task = await service.check_task(owner_user_id, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: int, owner_user_id: Annotated[str, Depends(require_owner_user_id)], service: TasksService = Depends(get_tasks_service)):
    await service.delete_task(owner_user_id, task_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
```

- [ ] **Step 8: Include router after automation placeholder**

Modify `services/tasks-service/app/main.py`:

```python
from fastapi import FastAPI

from app.modules.tasks.router import router as tasks_router


def create_app() -> FastAPI:
    app = FastAPI(title="parseVK Tasks Service")

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "UP"}

    app.include_router(tasks_router)
    return app


app = create_app()
```

Automation routes will be included before this router in Task 3.

- [ ] **Step 9: Run tasks API tests**

Run:

```bash
pytest services/tasks-service/tests/test_tasks_api.py -q
```

Expected:

```text
5 passed
```

- [ ] **Step 10: Run all tasks-service tests**

Run:

```bash
pytest services/tasks-service/tests -q
```

Expected: all tests pass.

- [ ] **Step 11: Commit PR-009**

```bash
git add services/tasks-service
git commit -m "feat: реализован api задач в tasks service"
```

---

## Task 3: PR-010 Automation Settings and Manual Run

**Files:**
- Create: `services/tasks-service/app/modules/automation/schemas.py`
- Create: `services/tasks-service/app/modules/automation/repository.py`
- Create: `services/tasks-service/app/modules/automation/service.py`
- Create: `services/tasks-service/app/modules/automation/router.py`
- Modify: `services/tasks-service/app/main.py`
- Test: `services/tasks-service/tests/test_automation_api.py`

- [ ] **Step 1: Write automation API tests**

Add `services/tasks-service/tests/test_automation_api.py` with tests for:

```python
import sys
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.main import create_app
from app.modules.automation.router import get_automation_service


class FakeAutomationService:
    async def get_settings(self, owner_user_id):
        return {
            "enabled": False,
            "runHour": 9,
            "runMinute": 0,
            "postLimit": 10,
            "timezoneOffsetMinutes": 0,
            "lastRunAt": None,
            "nextRunAt": None,
            "isRunning": False,
        }

    async def update_settings(self, owner_user_id, payload, request_id=None, correlation_id=None):
        return {
            "enabled": payload.enabled,
            "runHour": payload.run_hour,
            "runMinute": payload.run_minute,
            "postLimit": payload.post_limit,
            "timezoneOffsetMinutes": payload.timezone_offset_minutes,
            "lastRunAt": None,
            "nextRunAt": "2026-05-08T09:00:00Z" if payload.enabled else None,
            "isRunning": False,
        }

    async def run(self, owner_user_id, request_id=None, correlation_id=None):
        return {"started": False, "reason": "Нет завершённых задач для повторного запуска", "settings": await self.get_settings(owner_user_id)}


@pytest.fixture
def app():
    app = create_app()
    app.dependency_overrides[get_automation_service] = lambda: FakeAutomationService()
    return app


def headers():
    return {"X-Internal-Service-Token": "dev-internal-token", "X-User-ID": "user-1"}


@pytest.mark.asyncio
async def test_automation_settings_route_is_not_task_id_route(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/internal/tasks/automation/settings", headers=headers())

    assert response.status_code == 200
    assert response.json()["postLimit"] == 10


@pytest.mark.asyncio
async def test_update_settings_returns_next_run_when_enabled(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/internal/tasks/automation/settings",
            headers=headers(),
            json={"enabled": True, "runHour": 9, "runMinute": 0, "postLimit": 10, "timezoneOffsetMinutes": 0},
        )

    assert response.status_code == 200
    assert response.json()["nextRunAt"] == "2026-05-08T09:00:00Z"


@pytest.mark.asyncio
async def test_manual_run_no_completed_task_is_noop(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/internal/tasks/automation/run", headers=headers())

    assert response.status_code == 200
    assert response.json()["started"] is False
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
pytest services/tasks-service/tests/test_automation_api.py -q
```

Expected: import failure for `app.modules.automation.router`.

- [ ] **Step 3: Add automation schemas**

Add `services/tasks-service/app/modules/automation/schemas.py`:

```python
from pydantic import BaseModel, ConfigDict, Field


class AutomationSettingsUpdate(BaseModel):
    enabled: bool
    run_hour: int = Field(ge=0, le=23, alias="runHour")
    run_minute: int = Field(ge=0, le=59, alias="runMinute")
    post_limit: int = Field(ge=1, le=100, alias="postLimit")
    timezone_offset_minutes: int = Field(ge=-720, le=840, alias="timezoneOffsetMinutes")

    model_config = ConfigDict(populate_by_name=True)


class AutomationSettingsResponse(BaseModel):
    enabled: bool
    run_hour: int = Field(alias="runHour")
    run_minute: int = Field(alias="runMinute")
    post_limit: int = Field(alias="postLimit")
    timezone_offset_minutes: int = Field(alias="timezoneOffsetMinutes")
    last_run_at: str | None = Field(alias="lastRunAt")
    next_run_at: str | None = Field(alias="nextRunAt")
    is_running: bool = Field(alias="isRunning")

    model_config = ConfigDict(populate_by_name=True)


class AutomationRunResponse(BaseModel):
    started: bool
    reason: str | None
    settings: AutomationSettingsResponse
```

- [ ] **Step 4: Add automation repository**

Add repository methods:

```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Task, TaskAutomationSettings, utcnow


class AutomationRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_or_create_settings(self, owner_user_id: str) -> TaskAutomationSettings:
        settings = await self.session.scalar(
            select(TaskAutomationSettings).where(TaskAutomationSettings.owner_user_id == owner_user_id)
        )
        if settings:
            return settings
        settings = TaskAutomationSettings(owner_user_id=owner_user_id)
        self.session.add(settings)
        await self.session.flush()
        await self.session.refresh(settings)
        return settings

    async def lock_settings(self, owner_user_id: str) -> TaskAutomationSettings:
        settings = await self.get_or_create_settings(owner_user_id)
        locked = await self.session.scalar(
            select(TaskAutomationSettings)
            .where(TaskAutomationSettings.id == settings.id)
            .with_for_update()
        )
        return locked or settings

    async def has_active_automation_task(self, owner_user_id: str) -> bool:
        task = await self.session.scalar(
            select(Task.id).where(
                Task.owner_user_id == owner_user_id,
                Task.source == "automation",
                Task.status.in_(["pending", "running"]),
            )
        )
        return task is not None

    async def find_latest_completed_reusable_task(self, owner_user_id: str) -> Task | None:
        return await self.session.scalar(
            select(Task)
            .where(
                Task.owner_user_id == owner_user_id,
                Task.status == "done",
                Task.mode.is_not(None),
            )
            .where((Task.scope == "all") | ((Task.scope == "selected") & (Task.group_ids != [])))
            .order_by(Task.updated_at.desc(), Task.id.desc())
            .limit(1)
        )

    async def update_last_run_at(self, settings: TaskAutomationSettings) -> None:
        settings.last_run_at = utcnow()
        settings.updated_at = utcnow()
        await self.session.flush()
```

- [ ] **Step 5: Add automation service**

Implement:

```python
from datetime import datetime, timedelta, timezone

from app.db.models import Task, TaskAuditLog
from app.modules.automation.repository import AutomationRepository
from app.modules.automation.schemas import AutomationSettingsUpdate
from app.modules.tasks.mapper import task_to_response
from app.modules.tasks.repository import TasksRepository


class AutomationService:
    def __init__(self, session):
        self.repository = AutomationRepository(session)
        self.tasks = TasksRepository(session)

    async def get_settings(self, owner_user_id: str) -> dict:
        settings = await self.repository.get_or_create_settings(owner_user_id)
        return await self._settings_response(owner_user_id, settings)

    async def update_settings(self, owner_user_id: str, payload: AutomationSettingsUpdate, request_id: str | None = None, correlation_id: str | None = None) -> dict:
        settings = await self.repository.get_or_create_settings(owner_user_id)
        settings.enabled = payload.enabled
        settings.run_hour = payload.run_hour
        settings.run_minute = payload.run_minute
        settings.post_limit = payload.post_limit
        settings.timezone_offset_minutes = payload.timezone_offset_minutes
        await self.tasks.add_audit(
            TaskAuditLog(
                owner_user_id=owner_user_id,
                aggregate_type="task_automation_settings",
                aggregate_id=owner_user_id,
                task_id=None,
                event_type="task.automation_settings_updated",
                event_data={"enabled": settings.enabled, "postLimit": settings.post_limit},
            )
        )
        return await self._settings_response(owner_user_id, settings)

    async def run(self, owner_user_id: str, request_id: str | None = None, correlation_id: str | None = None) -> dict:
        settings = await self.repository.lock_settings(owner_user_id)
        if await self.repository.has_active_automation_task(owner_user_id):
            return {"started": False, "reason": "Есть активная automation-задача", "settings": await self._settings_response(owner_user_id, settings)}
        base_task = await self.repository.find_latest_completed_reusable_task(owner_user_id)
        if base_task is None:
            await self.tasks.add_audit(
                TaskAuditLog(owner_user_id=owner_user_id, aggregate_type="task_automation_settings", aggregate_id=owner_user_id, task_id=None, event_type="task.automation_run_requested", event_data={"started": False})
            )
            return {"started": False, "reason": "Нет завершённых задач для повторного запуска", "settings": await self._settings_response(owner_user_id, settings)}
        task = await self.tasks.create_task(
            Task(
                owner_user_id=owner_user_id,
                title=f"VK parse: {base_task.scope} / {base_task.mode}",
                description={"scope": base_task.scope, "mode": base_task.mode, "groupIds": base_task.group_ids, "postLimit": settings.post_limit},
                status="pending",
                scope=base_task.scope,
                mode=base_task.mode,
                group_ids=base_task.group_ids,
                post_limit=settings.post_limit,
                source="automation",
            )
        )
        await self.tasks.add_audit(TaskAuditLog(owner_user_id=owner_user_id, aggregate_type="task", aggregate_id=str(task.id), task_id=task.id, event_type="task.created", event_data={"taskId": str(task.id), "source": "automation"}))
        await self.tasks.add_audit(TaskAuditLog(owner_user_id=owner_user_id, aggregate_type="task", aggregate_id=str(task.id), task_id=task.id, event_type="task.automation_run_requested", event_data={"started": True, "taskId": str(task.id)}))
        await self.repository.update_last_run_at(settings)
        return {"started": True, "reason": None, "settings": await self._settings_response(owner_user_id, settings), "task": task_to_response(task)}

    async def _settings_response(self, owner_user_id: str, settings) -> dict:
        return {
            "enabled": settings.enabled,
            "runHour": settings.run_hour,
            "runMinute": settings.run_minute,
            "postLimit": settings.post_limit,
            "timezoneOffsetMinutes": settings.timezone_offset_minutes,
            "lastRunAt": settings.last_run_at.isoformat() if settings.last_run_at else None,
            "nextRunAt": self._next_run_at(settings),
            "isRunning": await self.repository.has_active_automation_task(owner_user_id),
        }

    def _next_run_at(self, settings) -> str | None:
        if not settings.enabled:
            return None
        now = datetime.now(timezone.utc)
        local_now = now - timedelta(minutes=settings.timezone_offset_minutes)
        local_next = local_now.replace(hour=settings.run_hour, minute=settings.run_minute, second=0, microsecond=0)
        if local_next <= local_now:
            local_next += timedelta(days=1)
        utc_next = local_next + timedelta(minutes=settings.timezone_offset_minutes)
        return utc_next.isoformat().replace("+00:00", "Z")
```

- [ ] **Step 6: Add automation router before task-id routes**

Add `services/tasks-service/app/modules/automation/router.py`:

```python
from typing import Annotated

from fastapi import APIRouter, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_internal_token, require_owner_user_id
from app.db.session import get_session
from app.modules.automation.schemas import AutomationSettingsUpdate
from app.modules.automation.service import AutomationService

router = APIRouter(prefix="/internal/tasks/automation", tags=["task-automation"], dependencies=[Depends(require_internal_token)])


async def get_automation_service(session: AsyncSession = Depends(get_session)) -> AutomationService:
    return AutomationService(session)


@router.get("/settings")
async def get_settings(owner_user_id: Annotated[str, Depends(require_owner_user_id)], service: AutomationService = Depends(get_automation_service)):
    return await service.get_settings(owner_user_id)


@router.post("/settings")
async def update_settings(
    payload: AutomationSettingsUpdate,
    owner_user_id: Annotated[str, Depends(require_owner_user_id)],
    service: AutomationService = Depends(get_automation_service),
    x_request_id: str | None = Header(default=None, alias="X-Request-ID"),
    x_correlation_id: str | None = Header(default=None, alias="X-Correlation-ID"),
):
    return await service.update_settings(owner_user_id, payload, request_id=x_request_id, correlation_id=x_correlation_id)


@router.post("/run")
async def run_automation(
    owner_user_id: Annotated[str, Depends(require_owner_user_id)],
    service: AutomationService = Depends(get_automation_service),
    x_request_id: str | None = Header(default=None, alias="X-Request-ID"),
    x_correlation_id: str | None = Header(default=None, alias="X-Correlation-ID"),
):
    return await service.run(owner_user_id, request_id=x_request_id, correlation_id=x_correlation_id)
```

Modify `services/tasks-service/app/main.py` to include automation before tasks:

```python
from fastapi import FastAPI

from app.modules.automation.router import router as automation_router
from app.modules.tasks.router import router as tasks_router


def create_app() -> FastAPI:
    app = FastAPI(title="parseVK Tasks Service")

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "UP"}

    app.include_router(automation_router)
    app.include_router(tasks_router)
    return app


app = create_app()
```

- [ ] **Step 7: Run automation tests**

Run:

```bash
pytest services/tasks-service/tests/test_automation_api.py services/tasks-service/tests/test_tasks_api.py -q
```

Expected: all tests pass, including route conflict test.

- [ ] **Step 8: Commit PR-010**

```bash
git add services/tasks-service
git commit -m "feat: добавлены automation настройки tasks service"
```

---

## Task 4: PR-011 Task Outbox Path

**Files:**
- Create: `services/tasks-service/app/modules/outbox/repository.py`
- Create: `services/tasks-service/app/modules/outbox/service.py`
- Create: `services/tasks-service/app/modules/outbox/publisher.py`
- Modify: `services/tasks-service/app/modules/tasks/service.py`
- Modify: `services/tasks-service/app/modules/automation/service.py`
- Test: `services/tasks-service/tests/test_outbox.py`

- [ ] **Step 1: Write outbox tests**

Add tests that assert:

```python
def test_task_event_type_has_no_version_suffix():
    assert "task.created".endswith(".v1") is False
```

Also test service calls create payloads without sensitive keys:

```python
SENSITIVE_KEYS = {"authorization", "cookie", "access_token", "refresh_token", "password"}


def assert_no_sensitive_payload(payload):
    lowered = {str(key).lower() for key in payload}
    assert lowered.isdisjoint(SENSITIVE_KEYS)
```

- [ ] **Step 2: Add outbox service**

Add `services/tasks-service/app/modules/outbox/service.py`:

```python
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import OutboxEvent


class OutboxService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def add_event(
        self,
        *,
        event_type: str,
        aggregate_type: str,
        aggregate_id: str,
        payload: dict,
        correlation_id: str | None = None,
        event_version: int = 1,
    ) -> OutboxEvent:
        event = OutboxEvent(
            event_type=event_type,
            event_version=event_version,
            aggregate_type=aggregate_type,
            aggregate_id=aggregate_id,
            correlation_id=correlation_id,
            payload=payload,
        )
        self.session.add(event)
        await self.session.flush()
        await self.session.refresh(event)
        return event
```

- [ ] **Step 3: Add repository and publisher**

Add repository batch methods with `with_for_update(skip_locked=True)` and publisher skeleton matching identity publisher behavior. Kafka key rules:

```python
def kafka_key_for_event(event_type: str, payload: dict, aggregate_id: str) -> str:
    if event_type == "task.automation_settings_updated":
        return str(payload["ownerUserId"])
    return str(payload.get("taskId") or aggregate_id)
```

- [ ] **Step 4: Wire outbox into tasks service**

In create/resume/delete, write outbox events in the same request transaction:

```python
await self.outbox.add_event(
    event_type="task.created",
    aggregate_type="task",
    aggregate_id=str(task.id),
    correlation_id=correlation_id,
    payload={"taskId": str(task.id), "ownerUserId": owner_user_id, "source": task.source},
)
```

Do not write outbox for `task.checked`.

- [ ] **Step 5: Wire outbox into automation service**

For settings update:

```python
await self.outbox.add_event(
    event_type="task.automation_settings_updated",
    aggregate_type="task_automation_settings",
    aggregate_id=owner_user_id,
    correlation_id=correlation_id,
    payload={"ownerUserId": owner_user_id, "enabled": settings.enabled, "postLimit": settings.post_limit},
)
```

For successful manual run:

```python
await self.outbox.add_event(
    event_type="task.automation_run_requested",
    aggregate_type="task",
    aggregate_id=str(task.id),
    correlation_id=correlation_id,
    payload={"taskId": str(task.id), "ownerUserId": owner_user_id, "source": "automation"},
)
```

No outbox for no-op automation run.

- [ ] **Step 6: Run outbox tests**

Run:

```bash
pytest services/tasks-service/tests/test_outbox.py services/tasks-service/tests/test_tasks_api.py services/tasks-service/tests/test_automation_api.py -q
```

Expected: all pass.

- [ ] **Step 7: Commit PR-011**

```bash
git add services/tasks-service
git commit -m "feat: добавлен outbox для tasks service"
```

---

## Task 5: PR-012 Gateway Tasks BFF

**Files:**
- Modify: `services/api-gateway/app/core/config.py`
- Create: `services/api-gateway/app/clients/tasks/schemas.py`
- Create: `services/api-gateway/app/clients/tasks/client.py`
- Create: `services/api-gateway/app/modules/tasks/service.py`
- Create: `services/api-gateway/app/modules/tasks/router.py`
- Modify: `services/api-gateway/app/main.py`
- Test: `services/api-gateway/tests/test_tasks_gateway.py`

- [ ] **Step 1: Add gateway tests**

Create tests with a fake tasks service and assert:

```python
async def test_gateway_forwards_user_id_to_tasks_service():
    assert fake_client.last_user_id == user_id_from_access_token
```

Also assert:

```python
GET /api/v1/tasks/automation/settings does not hit /api/v1/tasks/{task_id}
```

- [ ] **Step 2: Add config**

Modify `services/api-gateway/app/core/config.py`:

```python
tasks_base_url: str = "http://tasks-service:8000"
```

- [ ] **Step 3: Add tasks client**

Create `services/api-gateway/app/clients/tasks/client.py`:

```python
import httpx

from app.core.config import settings


class TasksClient:
    def __init__(self, base_url: str | None = None):
        self.base_url = base_url or settings.tasks_base_url

    def _headers(self, *, user_id: str, request_id: str | None, correlation_id: str | None) -> dict[str, str]:
        headers = {
            "X-Internal-Service-Token": settings.internal_service_token,
            "X-User-ID": user_id,
        }
        if request_id:
            headers["X-Request-ID"] = request_id
        if correlation_id:
            headers["X-Correlation-ID"] = correlation_id
        return headers

    async def request(self, method: str, path: str, *, user_id: str, request_id: str | None = None, correlation_id: str | None = None, json: dict | None = None, params: dict | None = None):
        async with httpx.AsyncClient(base_url=self.base_url, timeout=10) as client:
            response = await client.request(method, path, headers=self._headers(user_id=user_id, request_id=request_id, correlation_id=correlation_id), json=json, params=params)
        if response.status_code == 204:
            return None
        response.raise_for_status()
        return response.json()
```

- [ ] **Step 4: Add gateway tasks router**

Create `services/api-gateway/app/modules/tasks/router.py`. Register automation routes before `{task_id}` routes:

```python
from fastapi import APIRouter, Depends, Request, Response

from app.modules.auth.service import get_bearer_token
from app.modules.tasks.service import TasksGatewayService, get_tasks_gateway_service

router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])


@router.get("/automation/settings")
async def get_automation_settings(request: Request, service: TasksGatewayService = Depends(get_tasks_gateway_service)):
    return await service.forward(request, "GET", "/internal/tasks/automation/settings")


@router.post("/automation/settings")
async def update_automation_settings(payload: dict, request: Request, service: TasksGatewayService = Depends(get_tasks_gateway_service)):
    return await service.forward(request, "POST", "/internal/tasks/automation/settings", json=payload)


@router.post("/automation/run")
async def run_automation(request: Request, service: TasksGatewayService = Depends(get_tasks_gateway_service)):
    return await service.forward(request, "POST", "/internal/tasks/automation/run")


@router.post("/parse")
async def create_parse_task(payload: dict, request: Request, service: TasksGatewayService = Depends(get_tasks_gateway_service)):
    return await service.forward(request, "POST", "/internal/tasks/parse", json=payload)


@router.get("")
async def list_tasks(request: Request, service: TasksGatewayService = Depends(get_tasks_gateway_service)):
    return await service.forward(request, "GET", "/internal/tasks", params=dict(request.query_params))


@router.get("/{task_id}")
async def get_task(task_id: int, request: Request, service: TasksGatewayService = Depends(get_tasks_gateway_service)):
    return await service.forward(request, "GET", f"/internal/tasks/{task_id}")


@router.get("/{task_id}/audit-log")
async def get_audit_log(task_id: int, request: Request, service: TasksGatewayService = Depends(get_tasks_gateway_service)):
    return await service.forward(request, "GET", f"/internal/tasks/{task_id}/audit-log")


@router.post("/{task_id}/resume")
async def resume_task(task_id: int, request: Request, service: TasksGatewayService = Depends(get_tasks_gateway_service)):
    return await service.forward(request, "POST", f"/internal/tasks/{task_id}/resume")


@router.post("/{task_id}/check")
async def check_task(task_id: int, request: Request, service: TasksGatewayService = Depends(get_tasks_gateway_service)):
    return await service.forward(request, "POST", f"/internal/tasks/{task_id}/check")


@router.delete("/{task_id}", status_code=204)
async def delete_task(task_id: int, request: Request, service: TasksGatewayService = Depends(get_tasks_gateway_service)):
    await service.forward(request, "DELETE", f"/internal/tasks/{task_id}")
    return Response(status_code=204)
```

The service must validate access token through existing gateway auth security and use `sub` as `user_id`.

- [ ] **Step 5: Include router in gateway app**

Modify `services/api-gateway/app/main.py`:

```python
from app.modules.tasks.router import router as tasks_router

app.include_router(auth_router)
app.include_router(tasks_router)
```

- [ ] **Step 6: Run gateway tests**

Run:

```bash
pytest services/api-gateway/tests/test_tasks_gateway.py services/api-gateway/tests/test_auth_gateway.py -q
```

Expected: all pass.

- [ ] **Step 7: Commit PR-012**

```bash
git add services/api-gateway
git commit -m "feat: добавлен tasks bff в api gateway"
```

---

## Task 6: PR-013 Frontend Tasks API Switch

**Files:**
- Modify: `front/src/modules/tasks/api/tasks.api.ts`
- Modify: `front/src/modules/settings/api/taskAutomation.api.ts`
- Test: existing frontend auth/tasks tests where available

- [ ] **Step 1: Switch tasks API base**

Modify `front/src/modules/tasks/api/tasks.api.ts` to use gateway path:

```ts
import { GATEWAY_API_URL } from '@/shared/api'

const TASKS_API_URL = `${GATEWAY_API_URL}/v1/tasks`
```

Replace:

```ts
`${API_URL}/tasks`
```

with:

```ts
TASKS_API_URL
```

For task id routes, use:

```ts
`${TASKS_API_URL}/${id}`
```

- [ ] **Step 2: Switch automation API base**

Modify `front/src/modules/settings/api/taskAutomation.api.ts`:

```ts
import { GATEWAY_API_URL } from '@/shared/api'

const TASK_AUTOMATION_API_URL = `${GATEWAY_API_URL}/v1/tasks/automation`
```

Use:

```ts
`${TASK_AUTOMATION_API_URL}/settings`
`${TASK_AUTOMATION_API_URL}/run`
```

- [ ] **Step 3: Ensure no fake tasks fallback**

Search:

```bash
rg -n "mock|demo|fallback|return \\[\\]" front/src/modules/tasks front/src/modules/settings
```

Expected: no new fake task fallback is introduced. Existing `404 -> []` behavior in `tasks.api.ts` can remain only if the gateway route is absent during transition; do not add demo rows.

- [ ] **Step 4: Run frontend tests**

Run:

```bash
npm --prefix front test -- tasks
```

If no matching tests run, run:

```bash
npm --prefix front test -- auth
```

Expected: test command exits successfully.

- [ ] **Step 5: Commit PR-013**

```bash
git add front/src/modules/tasks/api/tasks.api.ts front/src/modules/settings/api/taskAutomation.api.ts
git commit -m "feat: переключен tasks frontend на api gateway"
```

---

## Task 7: PR-014 Compose, Smoke, Docs, Final Checks

**Files:**
- Modify: `docker-compose.yml`
- Modify: `docker-compose.deploy.yml`
- Modify: `.env.example`
- Modify: `docs/FASTAPI_MICROSERVICES.md`
- Create: `scripts/smoke-fastapi-tasks.sh`

- [ ] **Step 1: Add Compose services**

Add to `docker-compose.yml`:

```yaml
  tasks-db:
    image: postgres:16
    platform: linux/amd64
    restart: always
    ports:
      - "127.0.0.1:5435:5432"
    environment:
      POSTGRES_USER: ${TASKS_POSTGRES_USER:-tasks}
      POSTGRES_PASSWORD: ${TASKS_POSTGRES_PASSWORD:-tasks}
      POSTGRES_DB: ${TASKS_POSTGRES_DB:-tasks}
    volumes:
      - tasks_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - backend

  tasks-migrate:
    build:
      context: .
      dockerfile: services/tasks-service/Dockerfile
    restart: "no"
    depends_on:
      tasks-db:
        condition: service_healthy
    environment:
      TASKS_DATABASE_URL: postgresql+asyncpg://${TASKS_POSTGRES_USER:-tasks}:${TASKS_POSTGRES_PASSWORD:-tasks}@tasks-db:5432/${TASKS_POSTGRES_DB:-tasks}
    command: ["alembic", "upgrade", "head"]
    networks:
      - backend

  tasks-service:
    build:
      context: .
      dockerfile: services/tasks-service/Dockerfile
    restart: always
    depends_on:
      tasks-migrate:
        condition: service_completed_successfully
    environment:
      TASKS_DATABASE_URL: postgresql+asyncpg://${TASKS_POSTGRES_USER:-tasks}:${TASKS_POSTGRES_PASSWORD:-tasks}@tasks-db:5432/${TASKS_POSTGRES_DB:-tasks}
      TASKS_INTERNAL_SERVICE_TOKEN: ${FASTAPI_INTERNAL_SERVICE_TOKEN:-dev-internal-token}
      TASKS_OUTBOX_PUBLISH_ENABLED: ${TASKS_OUTBOX_PUBLISH_ENABLED:-false}
      TASKS_KAFKA_BOOTSTRAP_SERVERS: kafka:9092
    healthcheck:
      test: ["CMD-SHELL", "python -c \"import urllib.request; urllib.request.urlopen('http://localhost:8000/health', timeout=3)\""]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - backend
```

Add volume:

```yaml
  tasks_postgres_data:
```

Update `api-gateway`:

```yaml
    depends_on:
      identity-service:
        condition: service_healthy
      tasks-service:
        condition: service_healthy
    environment:
      GATEWAY_TASKS_BASE_URL: http://tasks-service:8000
```

- [ ] **Step 2: Add smoke script**

Add `scripts/smoke-fastapi-tasks.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${GATEWAY_BASE_URL:-http://127.0.0.1:3002}"
USERNAME="${IDENTITY_ADMIN_USERNAME:-admin}"
PASSWORD="${IDENTITY_ADMIN_PASSWORD:-admin-change-me}"
COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

echo "1. login"
LOGIN_BODY="$(mktemp)"
trap 'rm -f "$COOKIE_JAR" "$LOGIN_BODY"' EXIT
curl -sS -c "$COOKIE_JAR" -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}" \
  "$BASE_URL/api/v1/auth/login" > "$LOGIN_BODY"

ACCESS_TOKEN="$(node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); process.stdout.write(data.accessToken || data.access_token || '')" "$LOGIN_BODY")"
if [ -z "$ACCESS_TOKEN" ]; then
  echo "missing access token" >&2
  exit 1
fi

echo "2. create task"
TASK_BODY="$(mktemp)"
curl -sS -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{"scope":"all","groupIds":[1,2],"postLimit":10,"mode":"recent_posts"}' \
  "$BASE_URL/api/v1/tasks/parse" > "$TASK_BODY"

TASK_ID="$(node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); if (!Array.isArray(data.groupIds) || data.groupIds.length !== 0) process.exit(2); process.stdout.write(String(data.id || ''))" "$TASK_BODY")"
if [ -z "$TASK_ID" ]; then
  echo "missing task id" >&2
  exit 1
fi

echo "3. list"
curl -fsS -H "Authorization: Bearer $ACCESS_TOKEN" "$BASE_URL/api/v1/tasks" >/dev/null

echo "4. detail"
curl -fsS -H "Authorization: Bearer $ACCESS_TOKEN" "$BASE_URL/api/v1/tasks/$TASK_ID" >/dev/null

echo "5. audit"
curl -fsS -H "Authorization: Bearer $ACCESS_TOKEN" "$BASE_URL/api/v1/tasks/$TASK_ID/audit-log" >/dev/null

echo "6. automation settings"
curl -fsS -H "Authorization: Bearer $ACCESS_TOKEN" "$BASE_URL/api/v1/tasks/automation/settings" >/dev/null

echo "7. delete"
curl -fsS -X DELETE -H "Authorization: Bearer $ACCESS_TOKEN" "$BASE_URL/api/v1/tasks/$TASK_ID" >/dev/null

echo "FastAPI tasks smoke passed"
```

Run:

```bash
chmod +x scripts/smoke-fastapi-tasks.sh
```

- [ ] **Step 3: Update docs**

Add to `docs/FASTAPI_MICROSERVICES.md`:

```markdown
## Tasks Service

`tasks-service` owns new per-user tasks, task audit log, automation settings,
and task outbox events. It does not execute VK parsing in this slice; new tasks
may remain `pending` until `vk-service` is implemented.

Local launch:

```bash
docker compose up -d identity-db identity-migrate identity-seed-admin identity-service tasks-db tasks-migrate tasks-service api-gateway
```

Tasks smoke:

```bash
IDENTITY_ADMIN_PASSWORD=admin-change-me scripts/smoke-fastapi-tasks.sh
```
```

- [ ] **Step 4: Run Python tests**

Run:

```bash
pytest libs/py/common/tests services/api-gateway/tests services/identity-service/tests services/tasks-service/tests -q
```

Expected: all pass.

- [ ] **Step 5: Run frontend tests**

Run:

```bash
npm --prefix front test -- tasks
```

If no tasks tests are selected, run:

```bash
npm --prefix front test -- auth
```

Expected: command exits successfully.

- [ ] **Step 6: Run compose config check**

Run:

```bash
docker compose config --quiet
```

Expected: exit code 0. Existing warnings about unset `REDIS_PASSWORD` or `GRAFANA_ADMIN_PASSWORD` are not blockers.

- [ ] **Step 7: Run Docker tasks smoke**

Run:

```bash
docker compose up -d identity-db identity-migrate identity-seed-admin identity-service tasks-db tasks-migrate tasks-service api-gateway
IDENTITY_ADMIN_PASSWORD=admin-change-me scripts/smoke-fastapi-tasks.sh
```

Expected:

```text
FastAPI tasks smoke passed
```

- [ ] **Step 8: Commit PR-014**

```bash
git add docker-compose.yml docker-compose.deploy.yml .env.example docs/FASTAPI_MICROSERVICES.md scripts/smoke-fastapi-tasks.sh services/tasks-service
git commit -m "chore: добавлен smoke для tasks service"
```

---

## Final Verification Checklist

- [ ] Spec remains current: `docs/superpowers/specs/2026-05-07-tasks-service-migration-design.md`.
- [ ] `tasks-service` owns tasks DB and does not write Prisma schema.
- [ ] All task queries are scoped by `owner_user_id`.
- [ ] Gateway forwards `X-User-ID` only after access token validation.
- [ ] `scope=all` normalizes `groupIds` to `[]`.
- [ ] `scope=selected` requires non-empty `groupIds`.
- [ ] `completed` is derived from `status == "done"` and is not stored.
- [ ] Automation settings are per-user.
- [ ] Automation routes are registered before dynamic `{task_id}` routes.
- [ ] `task.checked` is audit-only.
- [ ] Outbox event names do not include `.v1`; versions use `event_version`.
- [ ] Outbox payloads contain no auth tokens, cookies, passwords, or Authorization headers.
- [ ] Docker smoke proves login -> create task -> list -> detail -> audit -> settings -> delete.
- [ ] NestJS `api/` remains present as fallback.
