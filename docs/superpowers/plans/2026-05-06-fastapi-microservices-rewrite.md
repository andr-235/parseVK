# FastAPI Microservices Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a parallel FastAPI microservices platform beside the current NestJS API, starting with `api-gateway`, `identity-service`, Apache Kafka, outbox, and frontend auth migration.

**Architecture:** Keep existing `api/` NestJS service working as fallback. Add Python services under `services/`, a small infrastructure-only package under `libs/py/common`, and route new frontend auth traffic through `api-gateway` to `identity-service`. Identity owns users, Argon2id passwords, RS256 JWT, refresh-token rotation, Alembic migrations, and Kafka identity events through outbox.

**Tech Stack:** FastAPI, Pydantic v2, SQLAlchemy 2 async, Alembic, pytest, httpx, PyJWT/cryptography, argon2-cffi, aiokafka, Apache Kafka KRaft, PostgreSQL, React/Vite frontend.

---

## Source Spec

Implement against [docs/superpowers/specs/2026-05-06-fastapi-microservices-rewrite-design.md](/home/pc051/Разработка/Работа/parseVK/docs/superpowers/specs/2026-05-06-fastapi-microservices-rewrite-design.md).

Do not remove or replace the current NestJS `api/` service during this stage.

## PR Slicing

1. `PR-001`: FastAPI workspace skeleton, tooling, common package.
2. `PR-002`: `identity-service` DB, Alembic migrations, idempotent admin seed command.
3. `PR-003`: `identity-service` auth core.
4. `PR-004`: `api-gateway` auth BFF, cookies, CSRF, JWKS validation.
5. `PR-005`: outbox, Kafka publish path, retry/idempotency.
6. `PR-006`: frontend auth switch to gateway.
7. `PR-007`: Docker smoke, tests, docs.

## Shared Rules

- Keep `libs/py/common` infrastructure-only: errors, events, request id, logging, pagination, security primitives, header constants.
- Do not place `User`, `Role`, `VKTask`, `TelegramMessage`, or other business models in `libs/py/common`.
- Use one SQLAlchemy `AsyncSession` per request/job. Never store a session globally or share it across concurrent tasks.
- Never log access tokens, refresh tokens, passwords, password hashes, private keys, `Authorization`, or `Set-Cookie`.
- Use Russian commit messages in the repo format, for example `feat: добавлен каркас python микросервисов`.

---

### Task 1: PR-001 FastAPI Workspace Skeleton

**Files:**
- Create: `pyproject.toml`
- Create: `libs/py/common/pyproject.toml`
- Create: `libs/py/common/common/__init__.py`
- Create: `libs/py/common/common/errors.py`
- Create: `libs/py/common/common/events.py`
- Create: `libs/py/common/common/headers.py`
- Create: `libs/py/common/common/logging.py`
- Create: `libs/py/common/common/pagination.py`
- Create: `libs/py/common/common/request_id.py`
- Create: `libs/py/common/common/security.py`
- Create: `libs/py/common/tests/test_events.py`
- Create: `libs/py/common/tests/test_errors.py`
- Create: `services/api-gateway/pyproject.toml`
- Create: `services/api-gateway/app/__init__.py`
- Create: `services/api-gateway/app/main.py`
- Create: `services/api-gateway/app/core/config.py`
- Create: `services/api-gateway/app/core/logging.py`
- Create: `services/api-gateway/app/core/middleware.py`
- Create: `services/api-gateway/app/core/security.py`
- Create: `services/api-gateway/app/modules/auth/router.py`
- Create: `services/api-gateway/tests/test_health.py`
- Create: `services/identity-service/pyproject.toml`
- Create: `services/identity-service/app/__init__.py`
- Create: `services/identity-service/app/main.py`
- Create: `services/identity-service/app/core/config.py`
- Create: `services/identity-service/app/core/security.py`
- Create: `services/identity-service/app/core/jwt.py`
- Create: `services/identity-service/tests/test_health.py`

- [x] **Step 1: Create root Python workspace metadata**

Add root `pyproject.toml`:

```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = [
  "libs/py/common/tests",
  "services/api-gateway/tests",
  "services/identity-service/tests",
]
pythonpath = [
  "libs/py/common",
  "services/api-gateway",
  "services/identity-service",
]

[tool.ruff]
line-length = 100
target-version = "py312"

[tool.ruff.lint]
select = ["E", "F", "I", "B", "UP", "ASYNC", "S"]
ignore = ["S101"]
```

- [x] **Step 2: Create `libs/py/common` package**

Use package name `parsevk-common` in `libs/py/common/pyproject.toml`:

```toml
[project]
name = "parsevk-common"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = ["pydantic>=2.8"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

Add `common/headers.py`:

```python
REQUEST_ID_HEADER = "X-Request-ID"
CORRELATION_ID_HEADER = "X-Correlation-ID"
INTERNAL_SERVICE_TOKEN_HEADER = "X-Internal-Service-Token"
CALLER_SERVICE_HEADER = "X-Caller-Service"
```

Add `common/errors.py`:

```python
from pydantic import BaseModel, Field


class ErrorDetail(BaseModel):
    code: str
    message: str
    field: str | None = None


class ErrorEnvelope(BaseModel):
    error: ErrorDetail
    request_id: str | None = None


def build_error(code: str, message: str, request_id: str | None = None) -> ErrorEnvelope:
    return ErrorEnvelope(error=ErrorDetail(code=code, message=message), request_id=request_id)
```

Add `common/events.py`:

```python
from datetime import datetime, timezone
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class EventEnvelope(BaseModel):
    event_id: UUID = Field(default_factory=uuid4)
    event_type: str
    event_version: int = 1
    occurred_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    producer: str
    correlation_id: str | None = None
    payload: dict[str, Any]
```

Add `common/request_id.py`:

```python
from uuid import uuid4


def new_request_id() -> str:
    return str(uuid4())
```

Add `common/pagination.py` with a small shared DTO only:

```python
from pydantic import BaseModel, Field


class PageParams(BaseModel):
    limit: int = Field(default=50, ge=1, le=200)
    offset: int = Field(default=0, ge=0)
```

Add `common/security.py`:

```python
from hashlib import sha256


def stable_sha256(value: str) -> str:
    return sha256(value.encode("utf-8")).hexdigest()
```

Add `common/logging.py`:

```python
SENSITIVE_HEADERS = {"authorization", "set-cookie", "cookie"}
SENSITIVE_FIELDS = {"password", "password_hash", "access_token", "refresh_token", "private_key"}


def is_sensitive_key(key: str) -> bool:
    return key.lower() in SENSITIVE_HEADERS or key.lower() in SENSITIVE_FIELDS
```

- [x] **Step 3: Add common package tests**

Add `libs/py/common/tests/test_events.py`:

```python
from common.events import EventEnvelope


def test_event_envelope_has_uuid_and_payload():
    event = EventEnvelope(
        event_type="identity.user_created",
        producer="identity-service",
        payload={"user_id": "u1"},
    )

    assert event.event_version == 1
    assert event.payload == {"user_id": "u1"}
    assert str(event.event_id)
```

Add `libs/py/common/tests/test_errors.py`:

```python
from common.errors import build_error


def test_build_error_envelope():
    envelope = build_error("unauthorized", "Unauthorized", request_id="req-1")

    assert envelope.request_id == "req-1"
    assert envelope.error.code == "unauthorized"
```

- [x] **Step 4: Create gateway and identity service skeletons**

Both services expose `/health`.

`services/api-gateway/app/main.py`:

```python
from fastapi import FastAPI


def create_app() -> FastAPI:
    app = FastAPI(title="parseVK API Gateway")

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "UP"}

    return app


app = create_app()
```

`services/identity-service/app/main.py` uses the same shape with title `parseVK Identity Service`.

Each service `pyproject.toml` includes:

```toml
[project]
name = "parsevk-api-gateway"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = ["fastapi>=0.115", "uvicorn[standard]>=0.30", "pydantic-settings>=2.4"]

[project.optional-dependencies]
test = ["httpx>=0.27", "pytest>=8.3", "pytest-asyncio>=0.23"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

For identity, set `name = "parsevk-identity-service"`.

- [x] **Step 5: Add health tests**

For each service, add a test with `httpx.AsyncClient` and `ASGITransport`:

```python
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import create_app


@pytest.mark.asyncio
async def test_health_returns_up():
    app = create_app()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "UP"}
```

- [x] **Step 6: Run skeleton tests**

Run:

```bash
pytest libs/py/common/tests services/api-gateway/tests services/identity-service/tests -q
```

Expected: all skeleton tests pass.

- [x] **Step 7: Commit PR-001**

```bash
git add pyproject.toml libs/py/common services/api-gateway services/identity-service
git commit -m "feat: добавлен каркас python микросервисов"
```

---

### Task 2: PR-002 Identity DB, Alembic, Models, Seed Admin

**Files:**
- Modify: `services/identity-service/pyproject.toml`
- Create: `services/identity-service/alembic.ini`
- Create: `services/identity-service/alembic/env.py`
- Create: `services/identity-service/alembic/versions/20260506_0001_create_identity_tables.py`
- Create: `services/identity-service/app/db/base.py`
- Create: `services/identity-service/app/db/session.py`
- Create: `services/identity-service/app/db/models.py`
- Modify: `services/identity-service/app/core/config.py`
- Modify: `services/identity-service/app/core/security.py`
- Create: `services/identity-service/app/cli.py`
- Create: `services/identity-service/tests/test_password_hashing.py`
- Create: `services/identity-service/tests/test_seed_admin.py`

- [x] **Step 1: Add identity DB dependencies**

Add to identity `pyproject.toml`:

```toml
dependencies = [
  "fastapi>=0.115",
  "uvicorn[standard]>=0.30",
  "pydantic-settings>=2.4",
  "SQLAlchemy[asyncio]>=2.0",
  "asyncpg>=0.29",
  "alembic>=1.13",
  "argon2-cffi>=23.1",
]
```

- [x] **Step 2: Implement settings**

`app/core/config.py`:

```python
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="IDENTITY_")

    database_url: str = Field(default="postgresql+asyncpg://postgres:postgres@localhost:5434/parsevk_identity")
    admin_username: str = Field(default="admin")
    admin_password: str = Field(default="admin-change-me")
    admin_email: str | None = None


settings = Settings()
```

- [x] **Step 3: Implement SQLAlchemy models**

`app/db/models.py` contains `User`, `RefreshToken`, `OutboxEvent` with UUID primary keys, timestamp fields, and explicit indexes/unique constraints matching the spec. Use `DeclarativeBase`, `Mapped`, `mapped_column`, `relationship`, `UUID(as_uuid=True)`, `JSONB`, and timezone-aware `DateTime(timezone=True)`.

Required enums as Python string constants:

```python
OUTBOX_PENDING = "pending"
OUTBOX_PUBLISHED = "published"
OUTBOX_FAILED = "failed"
ROLE_ADMIN = "admin"
ROLE_USER = "user"
```

- [x] **Step 4: Add Alembic migration**

Migration must create:

```sql
CREATE EXTENSION IF NOT EXISTS citext;
```

Then create `users`, `refresh_tokens`, `outbox_events`.

`refresh_tokens.token_hash` must be unique. `refresh_tokens.user_id` references `users.id` with cascade delete. Add indexes:

```python
op.create_index("ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"])
op.create_index("ix_refresh_tokens_family", "refresh_tokens", ["token_family_id"])
op.create_index("ix_outbox_events_status_next_attempt", "outbox_events", ["status", "next_attempt_at"])
op.create_index("ix_outbox_events_aggregate", "outbox_events", ["aggregate_type", "aggregate_id"])
```

- [x] **Step 5: Implement session factory**

`app/db/session.py`:

```python
from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

engine = create_async_engine(settings.database_url, pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_session() -> AsyncIterator[AsyncSession]:
    async with AsyncSessionLocal() as session:
        yield session
```

- [x] **Step 6: Implement Argon2id hashing**

`app/core/security.py`:

```python
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

password_hasher = PasswordHasher(time_cost=2, memory_cost=19456, parallelism=1)


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return password_hasher.verify(password_hash, password)
    except VerifyMismatchError:
        return False
```

- [x] **Step 7: Add idempotent seed-admin CLI**

`app/cli.py`:

```python
import asyncio

from sqlalchemy import select

from app.core.config import settings
from app.core.security import hash_password
from app.db.models import ROLE_ADMIN, User
from app.db.session import AsyncSessionLocal


async def seed_admin() -> None:
    async with AsyncSessionLocal() as session:
        existing = await session.scalar(select(User).where(User.username == settings.admin_username))
        if existing:
            return

        session.add(
            User(
                username=settings.admin_username,
                email=settings.admin_email,
                password_hash=hash_password(settings.admin_password),
                role=ROLE_ADMIN,
                is_active=True,
                is_superuser=True,
            )
        )
        await session.commit()


def main() -> None:
    asyncio.run(seed_admin())


if __name__ == "__main__":
    main()
```

- [x] **Step 8: Add tests**

`test_password_hashing.py` verifies correct password passes and wrong password fails.

`test_seed_admin.py` uses a test session override or a temporary DB fixture and calls `seed_admin()` twice. Assert one admin row exists after two calls.

- [x] **Step 9: Run identity DB tests**

Run:

```bash
pytest services/identity-service/tests/test_password_hashing.py services/identity-service/tests/test_seed_admin.py -q
```

Expected: password hashing and idempotent seed tests pass.

- [x] **Step 10: Commit PR-002**

```bash
git add services/identity-service
git commit -m "feat: добавлены миграции и seed admin для identity"
```

---

### Task 3: PR-003 Identity Auth Core

**Files:**
- Modify: `services/identity-service/app/core/config.py`
- Modify: `services/identity-service/app/core/jwt.py`
- Create: `services/identity-service/app/modules/users/schemas.py`
- Create: `services/identity-service/app/modules/users/repository.py`
- Create: `services/identity-service/app/modules/auth/schemas.py`
- Create: `services/identity-service/app/modules/auth/tokens.py`
- Create: `services/identity-service/app/modules/auth/service.py`
- Create: `services/identity-service/app/modules/auth/router.py`
- Modify: `services/identity-service/app/main.py`
- Create: `services/identity-service/tests/test_jwt.py`
- Create: `services/identity-service/tests/test_auth_service.py`
- Create: `services/identity-service/tests/test_auth_api.py`

- [x] **Step 1: Add JWT settings and dependencies**

Add dependencies:

```toml
"PyJWT>=2.9",
"cryptography>=43.0",
```

Settings:

```python
jwt_issuer: str = "identity-service"
jwt_audience: str = "api-gateway"
jwt_access_ttl_minutes: int = 10
jwt_private_key_pem: str
jwt_public_key_pem: str
jwt_key_id: str = "identity-dev-key-1"
refresh_token_ttl_days: int = 30
refresh_token_inactivity_days: int = 7
```

- [x] **Step 2: Implement JWT issuance and JWKS**

`app/core/jwt.py` must:

- issue RS256 access token;
- include claims `iss`, `aud`, `sub`, `jti`, `iat`, `nbf`, `exp`, `typ`, `roles`;
- set header `kid`;
- expose public JWK for gateway.

Add tests:

```python
from uuid import uuid4


def test_access_token_contains_required_claims():
    token = issue_access_token(user_id=str(uuid4()), roles=["admin"], settings=test_settings)
    claims = decode_for_test(token)
    assert claims["typ"] == "access"
    assert claims["aud"] == "api-gateway"
```

- [x] **Step 3: Implement refresh token helpers**

`auth/tokens.py`:

- generate opaque random token with `secrets.token_urlsafe(64)`;
- hash token with SHA-256 or Argon2id-compatible secret hashing;
- store only hash;
- hash `user_agent` and IP with `stable_sha256`.

Required functions:

```python
import hmac
import secrets

from common.security import stable_sha256


def generate_refresh_token() -> str:
    return secrets.token_urlsafe(64)


def hash_refresh_token(token: str) -> str:
    return stable_sha256(token)


def verify_refresh_token(token: str, token_hash: str) -> bool:
    return hmac.compare_digest(hash_refresh_token(token), token_hash)
```

- [x] **Step 4: Implement auth service**

`AuthService` methods:

```python
async def login(username: str, password: str, *, user_agent: str | None, ip: str | None) -> AuthResult
async def refresh(refresh_token: str, *, user_agent: str | None, ip: str | None) -> AuthResult
async def logout(refresh_token: str) -> None
async def me(user_id: UUID) -> UserDto
async def change_password(user_id: UUID, old_password: str, new_password: str) -> AuthResult
```

Rules:

- login returns generic `Invalid credentials` for unknown username or wrong password;
- inactive user cannot login or refresh;
- refresh rotates token every time;
- old refresh token gets `replaced_by_token_id`;
- refresh reuse revokes every token in the same `token_family_id`;
- change password revokes all previous refresh sessions.

- [x] **Step 5: Implement identity auth router**

Internal identity routes:

```text
POST /internal/auth/login
POST /internal/auth/refresh
POST /internal/auth/logout
GET  /internal/auth/me
POST /internal/auth/change-password
GET  /.well-known/jwks.json
```

All `/internal/*` routes require `X-Internal-Service-Token` except health and JWKS.

- [x] **Step 6: Add security tests**

Cover:

- wrong password -> 401 with generic message;
- inactive user cannot refresh;
- refresh reuse revokes family;
- logout twice is idempotent;
- password change invalidates old sessions;
- JWKS contains configured `kid`.

- [x] **Step 7: Run identity auth tests**

Run:

```bash
pytest services/identity-service/tests/test_jwt.py services/identity-service/tests/test_auth_service.py services/identity-service/tests/test_auth_api.py -q
```

Expected: auth, JWT, refresh rotation and internal-token protection tests pass.

- [x] **Step 8: Commit PR-003**

```bash
git add services/identity-service
git commit -m "feat: реализован auth core в identity service"
```

---

### Task 4: PR-004 API Gateway Auth BFF

**Files:**
- Modify: `services/api-gateway/pyproject.toml`
- Modify: `services/api-gateway/app/core/config.py`
- Modify: `services/api-gateway/app/core/middleware.py`
- Modify: `services/api-gateway/app/core/security.py`
- Create: `services/api-gateway/app/clients/identity/client.py`
- Create: `services/api-gateway/app/clients/identity/schemas.py`
- Create: `services/api-gateway/app/modules/auth/schemas.py`
- Create: `services/api-gateway/app/modules/auth/service.py`
- Modify: `services/api-gateway/app/modules/auth/router.py`
- Modify: `services/api-gateway/app/main.py`
- Create: `services/api-gateway/tests/test_auth_gateway.py`
- Create: `services/api-gateway/tests/test_jwt_validation.py`
- Create: `services/api-gateway/tests/test_csrf.py`

- [x] **Step 1: Add gateway dependencies**

Add:

```toml
"httpx>=0.27",
"PyJWT>=2.9",
"cryptography>=43.0",
```

- [x] **Step 2: Implement gateway settings**

Required settings:

```python
identity_base_url: str = "http://identity-service:8000"
internal_service_token: str
refresh_cookie_name: str = "__Host-refresh_token"
refresh_cookie_secure: bool = True
refresh_cookie_samesite: str = "lax"
csrf_cookie_name: str = "__Host-csrf_token"
csrf_header_name: str = "X-CSRF-Token"
jwt_issuer: str = "identity-service"
jwt_audience: str = "api-gateway"
```

- [x] **Step 3: Implement identity typed client**

`IdentityClient` uses `httpx.AsyncClient`, sends:

```text
X-Internal-Service-Token
X-Request-ID
X-Correlation-ID
X-Caller-Service: api-gateway
```

Methods:

```python
async def login(self, payload: LoginRequest) -> IdentityAuthResponse
async def refresh(self, refresh_token: str) -> IdentityAuthResponse
async def logout(self, refresh_token: str) -> None
async def me(self, access_token_subject: str) -> IdentityUser
async def change_password(self, user_id: str, payload: ChangePasswordRequest) -> IdentityAuthResponse
async def jwks(self) -> dict[str, object]
```

- [x] **Step 4: Implement BFF auth routes**

Public routes:

```text
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
POST /api/v1/auth/change-password
```

Gateway behavior:

- login returns `accessToken` and `user`;
- login sets refresh cookie and CSRF cookie;
- refresh reads refresh cookie, validates CSRF, returns new `accessToken`;
- logout reads refresh cookie, validates CSRF, calls identity, deletes cookies;
- me validates access token and asks identity for current user;
- change-password validates access token and CSRF, calls identity, rotates refresh cookie.

- [x] **Step 5: Implement CSRF protection**

Use SameSite cookie plus Origin/Referer validation plus CSRF header.

Local dev may allow insecure cookies only when `refresh_cookie_secure=false`.

For state-changing auth endpoints, reject when:

- refresh cookie exists and CSRF header is missing;
- CSRF header does not match CSRF cookie;
- Origin is present and not in allowed frontend origins.

- [x] **Step 6: Implement JWT validation**

Gateway validates:

- `alg == RS256`;
- known `kid` from JWKS;
- `iss`;
- `aud`;
- `exp`;
- `nbf`;
- `typ == access`.

Tests must include wrong `aud`, wrong `iss`, expired token, and wrong `typ`.

- [x] **Step 7: Add gateway auth integration tests**

Use mocked `IdentityClient` dependency. Assert:

- login sets `__Host-refresh_token` with `HttpOnly`, `Path=/`, no `Domain`;
- refresh without CSRF fails;
- refresh with CSRF succeeds and rotates cookie;
- logout deletes cookie;
- `/me` calls identity after token validation.

- [x] **Step 8: Run gateway tests**

Run:

```bash
pytest services/api-gateway/tests/test_auth_gateway.py services/api-gateway/tests/test_jwt_validation.py services/api-gateway/tests/test_csrf.py -q
```

Expected: gateway BFF, cookie, CSRF and JWT validation tests pass.

- [x] **Step 9: Commit PR-004**

```bash
git add services/api-gateway
git commit -m "feat: добавлен auth bff в api gateway"
```

---

### Task 5: PR-005 Outbox and Kafka Publish Path

**Files:**
- Modify: `services/identity-service/pyproject.toml`
- Create: `services/identity-service/app/modules/outbox/repository.py`
- Create: `services/identity-service/app/modules/outbox/publisher.py`
- Create: `services/identity-service/app/modules/outbox/service.py`
- Modify: `services/identity-service/app/modules/auth/service.py`
- Create: `services/identity-service/tests/test_outbox_repository.py`
- Create: `services/identity-service/tests/test_outbox_publisher.py`
- Create: `services/identity-service/tests/test_identity_events.py`
- Modify: `libs/py/common/common/events.py`
- Create: `libs/py/common/tests/test_event_schema.py`

- [x] **Step 1: Add Kafka dependency**

Add to identity:

```toml
"aiokafka>=0.11"
```

- [x] **Step 2: Finalize event envelope**

Ensure `EventEnvelope` contains:

```python
event_id: UUID
event_type: str
event_version: int
occurred_at: datetime
producer: str
correlation_id: str | None
payload: dict[str, Any]
```

Add schema tests for required fields.

- [x] **Step 3: Implement outbox repository**

Repository methods:

```python
async def add_event(session: AsyncSession, event: EventEnvelope, *, aggregate_type: str, aggregate_id: str) -> OutboxEvent
async def lock_pending_batch(session: AsyncSession, limit: int = 100) -> list[OutboxEvent]
async def mark_published(session: AsyncSession, event_id: UUID) -> None
async def mark_failed_or_retry(session: AsyncSession, event_id: UUID, error: str) -> None
```

`lock_pending_batch` must use:

```sql
FOR UPDATE SKIP LOCKED
```

through SQLAlchemy `with_for_update(skip_locked=True)`.

- [x] **Step 4: Emit identity events from auth service**

Create outbox records in the same transaction as domain changes:

- `identity.user_created` in seed-admin;
- `identity.user_logged_in` on login;
- `identity.password_changed` on change password;
- `identity.user_logged_out` on logout.

Kafka key for these events is `user_id`.

- [x] **Step 5: Implement Kafka publisher**

Publisher behavior:

- batch polls pending events;
- sends to topic `identity.events`;
- Kafka key is `aggregate_id`;
- waits for broker ack;
- sets `published_at` only after successful ack;
- retries with exponential backoff;
- after max attempts marks event `failed`.

- [x] **Step 6: Add outbox tests**

Tests:

- `add_event` stores payload and correlation id;
- `lock_pending_batch` returns pending events in created order;
- successful publish marks `published`;
- failed publish increments attempts and schedules retry;
- max attempts marks `failed`;
- events are idempotent by `event_id`.

- [x] **Step 7: Run outbox tests**

Run:

```bash
pytest libs/py/common/tests/test_event_schema.py services/identity-service/tests/test_outbox_repository.py services/identity-service/tests/test_outbox_publisher.py services/identity-service/tests/test_identity_events.py -q
```

Expected: event schema, outbox locking, retry and auth-event tests pass.

- [x] **Step 8: Commit PR-005**

```bash
git add libs/py/common services/identity-service
git commit -m "feat: добавлен outbox publish path для identity"
```

---

### Task 6: PR-006 Frontend Auth Switch to Gateway

**Files:**
- Modify: `front/src/modules/auth/api/auth.api.ts`
- Modify: `front/src/modules/auth/types/auth.ts`
- Modify: `front/src/modules/auth/lib/authSession.ts`
- Modify: `front/src/modules/auth/store/authStore.ts`
- Modify: `front/src/modules/auth/hooks/useAuthSession.ts`
- Modify: `front/src/app/providers/AuthProvider.tsx`
- Modify: `front/vite.config.ts`
- Modify: `front/.env.example`
- Modify: `front/src/app/providers/__tests__/AuthProvider.test.tsx`
- Create: `front/src/modules/auth/api/authGateway.api.test.ts`

- [x] **Step 1: Define frontend auth contract**

Types:

```ts
export interface AuthUser {
  id: string
  username: string
  role: string
  isActive: boolean
  isSuperuser: boolean
}

export interface AuthResponse {
  accessToken: string
  user: AuthUser
}
```

Remove refresh token from all frontend public types.

- [x] **Step 2: Update auth API client**

Routes:

```text
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
POST /api/v1/auth/change-password
```

Use `credentials: "include"` for auth calls. Add CSRF header for refresh/logout/change-password using the CSRF cookie value when present.

- [x] **Step 3: Remove refresh token storage**

Update `authSession.ts` and store logic:

- do not write refresh token to localStorage/sessionStorage;
- keep access token only in memory store;
- clear access token on logout and refresh failure.

- [x] **Step 4: Implement app boot lifecycle**

On app boot:

1. start without access token;
2. call `POST /api/v1/auth/refresh`;
3. if 200, store access token and user;
4. if 401, mark anonymous;
5. block protected API calls until restore completes.

- [x] **Step 5: Update Vite proxy/env**

Add env:

```text
VITE_GATEWAY_API_URL=/api
```

Proxy `/api/v1/auth` to gateway in local dev while old domain endpoints can still point at NestJS during transition.

- [x] **Step 6: Add frontend tests**

Tests:

- login stores access token but not refresh token;
- reload calls refresh with credentials;
- 401 refresh marks anonymous;
- logout calls gateway and clears memory state;
- change password does not expose refresh token.

- [x] **Step 7: Run frontend auth tests**

Run:

```bash
npm --prefix front test -- auth
```

Expected: auth-related frontend tests pass.

- [x] **Step 8: Commit PR-006**

```bash
git add front
git commit -m "feat: переключен auth frontend на api gateway"
```

---

### Task 7: PR-007 Docker Smoke, Documentation, Final Checks

**Files:**
- Modify: `docker-compose.yml`
- Modify: `docker-compose.deploy.yml`
- Create: `services/api-gateway/Dockerfile`
- Create: `services/identity-service/Dockerfile`
- Create: `services/identity-service/scripts/entrypoint.sh`
- Create: `services/api-gateway/.env.example`
- Create: `services/identity-service/.env.example`
- Modify: `.env.example`
- Create: `docs/FASTAPI_MICROSERVICES.md`
- Create: `scripts/smoke-fastapi-auth.sh`

- [x] **Step 1: Add Dockerfiles**

Both Python services:

- install package dependencies;
- run as non-root user when feasible;
- expose `8000`;
- start with `uvicorn app.main:app --host 0.0.0.0 --port 8000`.

Identity entrypoint must not seed implicitly unless command is `seed-admin`. Use separate compose job for migration/seed.

- [x] **Step 2: Add Compose services**

Add:

```yaml
identity-db:
  image: postgres:15-alpine
  environment:
    POSTGRES_DB: parsevk_identity
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres

kafka:
  image: apache/kafka:latest
  environment:
    KAFKA_PROCESS_ROLES: broker,controller
    KAFKA_NODE_ID: 1
    KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
```

Add `identity-service`, `identity-migrate`, `identity-seed-admin`, `api-gateway`.

NestJS `api` remains unchanged.

- [x] **Step 3: Add service healthchecks**

Healthchecks:

```text
api-gateway -> http://localhost:8000/health
identity-service -> http://localhost:8000/health
identity-db -> pg_isready
kafka -> broker readiness command available in image
```

- [x] **Step 4: Add smoke script**

`scripts/smoke-fastapi-auth.sh` should:

1. wait for gateway health;
2. login as seeded admin;
3. save cookies to `/tmp/parsevk-fastapi.cookies`;
4. call refresh with CSRF header;
5. call me with access token;
6. call logout;
7. assert refresh after logout returns 401.

Do not print access token or refresh cookie values.

- [x] **Step 5: Add docs**

`docs/FASTAPI_MICROSERVICES.md` includes:

- architecture summary;
- local env variables;
- migration command;
- seed command;
- dev compose command;
- smoke command;
- current boundaries: auth only, NestJS fallback remains.

- [x] **Step 6: Run backend tests**

Run:

```bash
pytest libs/py/common/tests services/api-gateway/tests services/identity-service/tests -q
```

Expected: all Python tests pass.

- [x] **Step 7: Run frontend auth tests**

Run:

```bash
npm --prefix front test -- auth
```

Expected: frontend auth tests pass.

- [x] **Step 8: Run Docker smoke**

Run:

```bash
docker compose up -d identity-db kafka identity-migrate identity-seed-admin identity-service api-gateway
scripts/smoke-fastapi-auth.sh
```

Expected:

- gateway `/health` returns `{"status":"UP"}`;
- login returns `200`;
- refresh returns `200`;
- me returns seeded admin;
- logout returns `200` or `204`;
- refresh after logout returns `401`;
- no token values are printed.

- [x] **Step 9: Check NestJS fallback remains available**

Status: skipped for local runtime by user decision. The existing NestJS `api/`
source remains present and was not removed during this migration stage.

Run the existing API health check:

```bash
curl -sS -i http://127.0.0.1:3000/api/health
```

Expected: existing NestJS API health still responds if the old `api` service is running.

- [x] **Step 10: Commit PR-007**

```bash
git add docker-compose.yml docker-compose.deploy.yml services/api-gateway services/identity-service .env.example docs/FASTAPI_MICROSERVICES.md scripts/smoke-fastapi-auth.sh
git commit -m "chore: добавлен docker smoke для fastapi микросервисов"
```

---

## Final Verification Checklist

- [x] Spec remains current: `docs/superpowers/specs/2026-05-06-fastapi-microservices-rewrite-design.md`.
- [x] Implementation commits are split by PR slice, not one large mixed commit.
- [x] `libs/py/common` contains no business models.
- [x] Refresh token never appears in frontend state, localStorage, sessionStorage, logs, or DB plaintext.
- [x] Gateway owns cookies and CSRF.
- [x] Identity owns JWT issuance and refresh-token state.
- [x] Kafka events are written through outbox, not direct request-time publish only.
- [x] Docker smoke proves login -> refresh -> me -> logout.
- [x] NestJS `api/` remains present; local fallback health check was skipped by user decision.

## Execution Option

Recommended execution: subagent-driven development, one fresh worker per PR slice, with review between tasks. Inline execution is acceptable if the workspace must remain single-threaded.
