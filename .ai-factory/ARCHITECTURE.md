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
│   ├── core/          # Config (pydantic-settings), dependencies, exceptions
│   ├── modules/       # Feature modules (router, service, repository, schemas)
│   ├── db/            # SQLAlchemy models, session factory
│   └── main.py        # FastAPI app factory (create_app)
├── alembic/           # Database migrations
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
- ❌ **Shared databases between services:** Each service owns its DB. Access foreign data only via API.
- ❌ **Silent exceptions:** Never `except: pass`. Always log the reason.
- ❌ **Files > 150 lines:** Decompose into smaller modules.
- ❌ **Magic numbers:** All constants in config or env vars with typed enums.
