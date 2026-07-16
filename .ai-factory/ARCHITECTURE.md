# Architecture: Microservices + Three-Tier

## Overview

ParseVK follows a microservice architecture with 9 independently deployable FastAPI services, a React frontend, and an API Gateway as the single entry point. Each service adheres to a strict three-tier pattern (Router → Service → Repository) with synchronous HTTP communication through the gateway and asynchronous event-driven interaction via Kafka.

## Decision Rationale

- **Project type:** Social media analytics platform with multi-source content collection (VK, Telegram, WhatsApp)
- **Tech stack:** Python 3.12+ (FastAPI) backend, React 19 frontend, Go CLI tooling
- **Key factor:** Independent scaling of domain-specific services (identity, tasks, parsing, moderation, content, messaging) with clear bounded contexts

## Folder Structure

```
parseVK/
├── front/                          # React SPA (Vite, Tailwind, TanStack Query)
│   └── src/
│       ├── pages/                  # Page components
│       ├── components/             # Shared UI components
│       ├── hooks/                  # Custom React hooks
│       ├── stores/                 # Zustand stores
│       ├── api/                    # API client layer
│       └── types/                  # TypeScript types
├── services/
│   ├── api-gateway/               # Single entry point, route proxying
│   ├── identity-service/          # Auth (JWT), users, roles
│   ├── tasks-service/             # Parsing task orchestration
│   ├── vk-service/                # VKontakte API integration
│   ├── content-service/           # Content storage and retrieval
│   ├── moderation-service/        # Content moderation pipeline
│   ├── telegram-service/          # Telegram client (Telethon) and tgmbase import/match
│   ├── listings-service/          # Listings storage and CSV export
│   └── im-service/                # Instant messaging (WhatsApp via Wappi.pro)
├── libs/py/common/                # Shared Python library (models, exceptions, Kafka helpers)
├── tools/parsevkctl-go/           # Go CLI for GitHub automation
├── monitoring/                    # Prometheus + Grafana configs
└── docker/                        # Dockerfiles, compose configs
```

Each service follows one of the architectural patterns below:

### Layered Architecture (Refactored Services, e.g., `vk-service`)

Follows a strict clean layered structure with a dependency flow of: `api / tasks -> services -> domain <- infrastructure`.

```
services/vk-service/
├── app/
│   ├── api/            # Presentation layer (routers, schemas, dependencies)
│   ├── services/       # Business logic (application services, formatters, pipelines)
│   ├── domain/         # Domain model & repository interfaces (core contracts)
│   ├── infrastructure/ # Implementation details (SQLAlchemy repositories, API clients, DB sessions)
│   ├── tasks/          # Background processes (Kafka consumer, outbox worker)
│   ├── bootstrap.py    # Composition Root (manual DI injection)
│   └── main.py         # FastAPI application entrypoint
├── alembic/           # Database migrations
├── tests/             # Unit and Integration tests
├── pyproject.toml     # uv-managed dependencies and tools config
└── Dockerfile
```

### Legacy Three-Tier Structure (Other Services)

```
services/<name>/
├── app/
│   ├── api/            # Presentation layer (routers, schemas, dependencies)
│   ├── background/     # Background workers (outbox publisher, automation scheduler, supervisor)
│   ├── core/           # Config (pydantic-settings), dependencies, exceptions
│   ├── modules/        # Feature modules (router, service, repository, schemas)
│   ├── db/             # SQLAlchemy models, session factory
│   └── main.py         # FastAPI app factory (create_app)
├── alembic/            # Database migrations
├── tests/
├── pyproject.toml
└── Dockerfile
```


## Dependency Rules

- ✅ **Router → Service:** Routers handle HTTP concerns (parsing, validation, response formatting). They call services, never repositories directly.
- ✅ **Service → Repository:** Services contain business logic. They call repositories for data access.
- ✅ **Repository → Database:** Repositories handle raw SQLAlchemy queries. No business logic.
- ❌ **Business logic in Router or Repository:** Never. Services are the sole owner of business rules.
- ❌ **Cross-service DB access:** Each service owns its database. Access foreign data only via HTTP API.
- ✅ **Event-driven via Kafka:** For async inter-service communication (tasks, content, moderation).
- ✅ **Synchronous via Gateway:** For direct CQRS queries through API Gateway.

## Layer/Module Communication

- **Frontend → API Gateway:** HTTP/HTTPS via `/api/v1` proxy (dev: Vite proxy, prod: Nginx)
- **API Gateway → Backend Services:** Internal HTTP with `FASTAPI_INTERNAL_SERVICE_TOKEN`
- **Service → Service (async):** Kafka topics (`parsevk.tasks.events`, `parsevk.vk.events`, `parsevk.im.events`)
- **Service → Service (sync):** Direct HTTP calls between services (e.g., vk-service → tasks-service)

## API Gateway Internal Architecture (Three-Tier)

The API Gateway (`services/api-gateway`) applies a three-tier pattern internally for its own module structure — not to be confused with the microservice-level three-tier:

```
HTTP Request → Router (HTTP concerns) → Service (business logic) → Client (backend HTTP)
```

Each module in `app/modules/<name>/` follows this pattern:

| Layer | File | Responsibility | FastAPI Dependency |
|-------|------|---------------|--------------------|
| **Router** | `router.py` | Route registration, request validation, response formatting | `Request`, `Depends()` |
| **Service** | `service.py` | Business logic, enrichment, error translation | **No `Request` dependency** |
| **Client** | `app/clients/<name>/client.py` | Typed HTTP client for backend service | Inherits `ServiceClient` |

### Request Flow + Exception Translation

```
Router → Service (forward_service_request) → Client (request) → Backend Service
                                                      ↓
                                            ServiceClientHTTPError  ← httpx.HTTPStatusError
                                            ServiceClientUnavailableError ← httpx.RequestError
                                                      ↓
                                            BackendServiceError / BackendUnavailableError
                                                      ↓
                                            translate_gateway_error() → HTTPException
Router ← Service raises GatewayError ←
```

**Exception hierarchy** — all domain exceptions inherit from `GatewayError`:

| Exception | Origin | Router HTTP Status |
|-----------|--------|--------------------|
| `BackendServiceError` | `ServiceClientHTTPError` (4xx/5xx from backend) | Preserved (404, 409, etc.) |
| `BackendUnavailableError` | `ServiceClientUnavailableError` (connection refused/timeout) | 502 Bad Gateway |
| `ServiceNotFoundError` | Domain logic | 404 |
| `ServiceValidationError` | Domain logic | 422 |
| `ServiceAuthError` | Domain logic | 401 |
| `ServiceForbiddenError` | Domain logic | 403 |
| `ServiceConflictError` | Domain logic | 409 |

### Core forwarding function

Services call `forward_service_request()` from `app/modules/_base.py` which:
- Accepts a `ServiceClient` (not `Request`), making services testable without FastAPI
- Translates `ServiceClientHTTPError` → `BackendServiceError`
- Translates `ServiceClientUnavailableError` → `BackendUnavailableError`
- Passes through `user_id`, `request_id`, `correlation_id`, `params`, `json`, `files`

### Example: Comments Module

```python
# app/modules/comments/service.py — no Request dependency
class CommentsGatewayService:
    def __init__(self, moderation_client: ServiceClient, content_client: ServiceClient):
        self.moderation_client = moderation_client
        self.content_client = content_client

    async def get_comments(self, post_id: int, user_id: str, ...) -> list[dict]:
        raw = await forward_service_request(
            self.moderation_client, "GET", f"/internal/comments/{post_id}",
            user_id=user_id, params={"page": page, "limit": limit},
        )
        enriched = await self._enrich_comments(raw, user_id)
        return [format_comment(c) for c in enriched]
```

### Example: Backend Service Client

```python
# app/clients/content/client.py — typed client for content-service
class ContentServiceClient(ServiceClient):
    async def search_authors(self, query: str, user_id: str, ...) -> list[dict]:
        return await self.request(
            "GET", "/internal/authors/search",
            user_id=user_id, params={"q": query},
        )
```

## Key Principles

1. **Database per Service:** 8 PostgreSQL databases (identity, tasks, vk, content, moderation, im, telegram, listings). No shared databases.
2. **Idempotent Consumers:** Kafka consumers must handle duplicate delivery (dedup by event_id or upsert).
3. **Outbox Pattern:** Services publish domain events via an outbox table to ensure reliable Kafka delivery.
4. **File Size Limit:** Max 100-150 lines per file. Decompose into modules when exceeded. Exceptions: configs, migrations, autogen.
5. **Type Safety:** Pydantic v2 schemas for all I/O. TypeScript types for frontend. Pydantic Settings for all configs.

## Event-Driven Architecture Compliance

### Current State — Kafka Topics & Event Flow

| Topic | Partitions | Producer (Outbox) | Consumers | Event Types |
|-------|-----------|-------------------|-----------|-------------|
| `parsevk.tasks.events` | 3 | tasks-service | vk-service, im-service | `task.created`, `.resumed`, `.deleted`, `.cancelled`, `.completed`, `.failed`, `.automation_settings_updated`, `.automation_run_requested` |
| `parsevk.vk.events` | 3 | vk-service | content-service, moderation-service | `vk.group_collected`, `.group_deleted`, `.author_collected`, `.post_collected`, `.comment_collected`, `.task_progress_updated`, `.task_completed`, `.task_failed` |
| `parsevk.im.events` | 3 | im-service | content-service | `im.message_collected`, `.group_collected`, `.task_progress_updated`, `.task_completed`, `.task_failed` |
| `identity.events` | 3 | identity-service | — | `identity.user_created`, `.user_logged_in`, `.user_logged_out`, `.password_changed` |
| `parsevk.vk.dlq` | 3 | vk-service | — | Failed vk outbox events exceeding retry limit |
| `parsevk.im.dlq` | 3 | im-service | — | Failed im outbox events exceeding retry limit |
| `identity.dlq` | 3 | identity-service | — | Failed identity outbox events exceeding retry limit |
| `parsevk.tasks.dlq` | 3 | tasks-service | — | Outbox events exceeding max retries (producer-side DLQ) |

### Services Without Kafka

| Service | Reason |
|---------|--------|
| **api-gateway** | No outbox, no consumer, no Kafka code — pure HTTP proxy |
| **listings-service** | No outbox, no consumer, no Kafka code |
| **telegram-service** | No outbox, no consumer, no Kafka code |

### Principal Event Flows

```
                            ┌────────────────┐
                            │ identity.svc   │──→ identity.events
                            │ (publisher)    │──→ identity.dlq
                            └────────────────┘

                            ┌────────────────┐
                            │ tasks.svc      │──→ parsevk.tasks.events
                            │ (publisher)    │──→ parsevk.tasks.dlq
                            └──────┬─────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
            ┌────────────┐ ┌────────────┐
            │ vk.svc     │ │ im.svc     │
            │ consumer   │ │ consumer   │
            │ producer   │ │ producer   │
            └──────┬─────┘ └──────┬─────┘
                   │              │
                   │ parsevk.vk.events  parsevk.im.events
                   │              │
                   ▼              ▼
            ┌────────────┐ ┌────────────┐ ┌────────────┐
            │ content.svc│ │ content.svc│ │ moderation │
            │ (VK cons)  │ │ (IM cons)  │ │ (VK cons)  │
            └────────────┘ └────────────┘ └────────────┘
```

### Compliance Score

| Pattern | Status | Details |
|---------|--------|---------|
| ✅ Outbox Pattern | Done (4/4 producers) | tasks, vk, im, identity — all active with publisher |
| ✅ Transactional Outbox | Done | All producers: business logic + outbox insert in same DB transaction. `SELECT ... FOR UPDATE SKIP LOCKED` for publisher |
| ✅ Idempotent Consumers | Done | `processed_events` table with `UNIQUE(consumer_name, event_id)` across all 4 consumers |
| ✅ Exponential Outbox Backoff | Done | `next_attempt_at = now + min(2^attempts, 300)s`, max 5 attempts across all producers |
| ✅ Producer Deduplication | Done | `dedupe_key` with `ON CONFLICT DO NOTHING` across all 4 outbox services |
| ✅ Event Versioning | Done | `event_version` field in all outbox tables + checked by all consumers (though never exercised — always version 1) |
| ✅ Multi-Partition Topics | Done | All topics have 3 partitions (configured in docker-compose.yml) |
| ✅ Consumer Lag Monitoring | Done | `kafka_consumer_lag` Prometheus metric in all 4 consumers (vk, im, content×2, moderation) |
| ✅ Health Endpoints | Done | All 6 Kafka-related services expose /health with kafka/outboxPublisher status |
| ✅ Dead Letter Queue | Done (7/9) | vk, im, identity have producer-side + consumer-side DLQ. content, moderation have consumer-side DLQ. **tasks-service has producer-side DLQ** |
| ⚠️ Consumer Retry (In-Memory) | Partial | All consumers have `_retry_count` dict with max 3 retries, but **in-memory only** — lost on restart |
| ⚠️ Shared Event Schemas | Partial | `EventEnvelope`/`WireEvent`/`ConsumerEvent` exist in `libs/py/common/events/`. identity-service and tasks-service use them. Shared helpers (`common.events.helpers`) extracted. im-service refactored to use shared helpers. vk-service, content-service, moderation-service still use legacy local models |
| ❌ Distributed Tracing | Missing | No OpenTelemetry/Jaeger. `correlation_id` propagated but not traced across service boundaries |
| ❌ `identity.events` Has No Consumers | Fire-and-Forget | Identity publishes events but no service subscribes — events are produced with zero observable effect |
| ❌ Exactly-Once Semantics | Missing | No `transactional.id` or explicit `enable.idempotence` config on any producer (aiokafka defaults apply) |

### Schema Evolution & Versioning Policy

All event envelopes carry an `event_version` integer field. Current version is `1`.

- **Backward-compatible changes** (adding optional fields, extending enums): bump minor. Consumers must ignore unknown fields.
- **Breaking changes** (removing/renaming fields, changing types): bump `event_version`. Consumers validate and reject unknown versions with a warning.
- **Policy**: Producers MUST NOT produce events with unsupported versions. Consumers MUST reject events with unknown versions (logged + skipped). Migration path: stand up new version in parallel, then deprecate old version after all consumers have been updated.
- **Real-world note:** `event_version` infrastructure exists but has never been exercised — all events are always version 1.

### Required Improvements for Full EDA Compliance

| Priority | Task | Details | Files |
|----------|------|---------|-------|
| P0 | **Shared event schemas** | ⚠️ **Partially Done** — tasks-service uses `WireEvent`, im-service refactored, shared helpers created. **Remaining:** vk-service, content-service, moderation-service still use legacy local models | `libs/py/common/common/events/` + vk-service, content-service, moderation-service |
| P1 | **Persistent consumer retry** | Move `_retry_count` from in-memory dict to DB-backed (use `processed_events` table). Survive restarts | All 4 consumer services |
| P1 | **Consumer-side backoff** | Add `next_attempt_at` style backoff to consumers instead of immediate retry | All 4 consumer services |
| P1 | **DLQ monitoring/alerting** | Add Prometheus alert rules for DLQ topic non-zero offset. No one monitors failed events today | `monitoring/prometheus/` |
| P2 | **Consumer for identity.events** | Either add a consumer or remove the publisher. Currently fire-and-forget with no observable effect | `services/identity-service/` |
| P2 | **OpenTelemetry tracing** | Propagate trace context through Kafka message headers. Add OTLP exporter | `libs/py/common/` + all services |
| P2 | **Schema registry** | Formal schema registry for event versioning. Currently `event_version` exists but versioning policy is manual | `libs/py/common/events/` |
| P3 | **Exactly-once semantics** | Configure Kafka transactions with `transactional.id` on producers | All 4 producer services |
| P3 | **Integration tests** | Add testcontainers-based Kafka tests for all consumer/producer services (only vk-service has them today) | All services with Kafka |

## Code Examples

### Router (api-gateway, proxy route)

```python
from fastapi import APIRouter, Depends, Request
from httpx import AsyncClient

router = APIRouter()

@router.get("/users/me")
async def get_current_user(
    request: Request,
    client: AsyncClient = Depends(get_internal_client),
):
    response = await client.get(
        f"{settings.identity_base_url}/users/me",
        headers={"Authorization": request.headers.get("Authorization", "")},
    )
    response.raise_for_status()
    return response.json()
```

### Service + Repository (vk-service)

```python
class VkFriendsExportService:
    def __init__(self, repo: VkFriendsExportRepository, vk_client: VkApiClient):
        self.repo = repo
        self.vk_client = vk_client

    async def export(self, job_id: str) -> None:
        job = await self.repo.get_job(job_id)
        friends = await self.vk_client.get_friends(job.owner_id)
        await self.repo.save_friends(job.id, friends)


class VkFriendsExportRepository:
    async def get_job(self, job_id: str) -> Job:
        stmt = select(JobModel).where(JobModel.id == job_id)
        result = await self.session.execute(stmt)
        job = result.scalar_one_or_none()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return job
```

## Anti-Patterns

- ❌ **Business logic in Router or Repository:** Always belongs in Service layer.
- ❌ **Synchronous chains:** Service A → Service B → Service C over HTTP. Use Kafka for async flows.
- ❌ **Dead outbox publishers:** Every service with an outbox table MUST have a running publisher. Identity-service is currently non-compliant.
- ❌ **Shared databases between services:** Each service owns its DB. Access foreign data only via API.
- ❌ **Silent exceptions:** Never `except: pass`. Always log the reason.
- ❌ **Files > 150 lines:** Decompose into smaller modules.
- ❌ **Magic numbers:** All constants in config or env vars with typed enums.
