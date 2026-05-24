# Backend Migration Status

Audit date: 2026-05-24.

This document is the current source of truth for the NestJS to FastAPI backend migration. The old `api/` service remains a fallback until each domain is explicitly switched off.

## Status Legend

- `migrated` - the public frontend path uses FastAPI/gateway for the stated scenario.
- `partial` - FastAPI service/endpoint exists, but some scenarios remain on NestJS fallback.
- `fallback` - no new FastAPI domain exists yet; the frontend still uses legacy NestJS.
- `intentionally kept` - kept on legacy NestJS stack by architectural design (e.g. legacy infra/metrics).
- `removed` - component or script has been removed from the repository.

## Frontend Public Paths
* **Auth**: Routed through FastAPI API-Gateway `/api/v1/auth/*`.
* **Tasks**: Routed through FastAPI API-Gateway `/api/v1/tasks/*` (except some legacy websockets).
* **Admin Users**: Routed through FastAPI API-Gateway `/api/v1/admin/users/*`.
* **Content Reads (basic)**: Routed through FastAPI API-Gateway `/api/v1/content/*` for unfiltered reads of `comments`, `authors`, and `groups`.
* **Filtered Comments & Moderation**: Routed through FastAPI API-Gateway `/api/v1/comments/*` for paginated list, cursor pagination, and read status updates.
* **All other endpoints**: Routed through the old NestJS fallback `/api/v1/*` implicitly.

## Detailed Legacy Controllers Audit & Map

Every controller from legacy NestJS `api/src/*` is mapped explicitly below:

| Legacy NestJS Controller | Route Prefix | New Service / Endpoint | Status | Migration Details & Remaining Work |
| --- | --- | --- | --- | --- |
| `app.controller.ts` | `/` | `api-gateway /health` | `intentionally kept` | Keep basic NestJS API root/health checks in NestJS; Gateway handles public health checks at `/health`. |
| `auth/auth.controller.ts` | `auth` | `api-gateway /api/v1/auth/*` -> `identity-service /internal/auth/*` | `migrated` | Login, refresh, logout, me, and change-password are fully migrated. |
| `users/admin-users.controller.ts` | `admin/users` | `api-gateway /api/v1/admin/users/*` -> `identity-service /internal/admin/users/*` | `migrated` | Full user CRUD, temporary passwords, reset passwords, and list endpoints are fully migrated. |
| `tasks/tasks.controller.ts` | `tasks` | `api-gateway /api/v1/tasks/*` -> `tasks-service /internal/tasks/*` | `migrated` | Creation of parse tasks, task listings, task details, audit logs, and deletes are fully migrated. Legacy websocket updates remain on NestJS. |
| VK Ingestion / Parsing | `internal` | `vk-service` execution | `migrated` | VK ingestion execution flow is fully production-ready, E2E-tested, idempotent by runId/events, and secure with startup token checks. |
| `tasks/automation/task-automation.controller.ts` | `tasks/automation` | `api-gateway /api/v1/tasks/automation/*` -> `tasks-service` | `migrated` | Setting automation configs and triggering automation runs are fully migrated. |
| `comments/comments.controller.ts` | `comments` | `api-gateway /api/v1/comments/*` -> `moderation-service /internal/moderation/*` | `partial` | `GET /comments`, `GET /comments/cursor`, and `PATCH /comments/:id/read` are migrated to `moderation-service` (with bulk author/post enrichment via `content-service`). Legacy `POST /comments/search` and advanced search features stay on NestJS `fallback`. |
| `authors/authors.controller.ts` | `authors` | `api-gateway /api/v1/content/authors/*` -> `content-service` | `partial` | Unfiltered authors reads and details are migrated to `content-service`. CRUD refresh, delete, verify, and photo enrichment stay on NestJS `fallback`. |
| `groups/groups.controller.ts` | `groups` | `api-gateway /api/v1/content/groups/*` -> `content-service` | `partial` | Unfiltered groups read/details are migrated to `content-service`. Settings, upload, and CRUD stay on NestJS `fallback`. |
| `metrics/metrics.controller.ts` | `metrics` | NestJS Prometheus endpoints | `intentionally kept` | Maintained in NestJS for backwards monitoring compatibility. |
| `data-import/data-import.controller.ts` | `data` | None | `fallback` | Data import endpoints still stay on NestJS. |
| `keywords/keywords.controller.ts` | `keywords` | None | `fallback` | Keyword CRUD and settings stay on NestJS. |
| `listings/listings.controller.ts` | `listings` | None | `fallback` | Listings and exports stay on NestJS. |
| `watchlist/watchlist.controller.ts` | `watchlist` | None | `fallback` | Group watchlist monitoring stays on NestJS. |
| `photo-analysis/photo-analysis.controller.ts` | `photo-analysis` | None | `fallback` | Photo analysis and categorization stays on NestJS. |
| `telegram/telegram-auth.controller.ts` | `telegram` | None | `fallback` | Telegram authentication stays on NestJS. |
| `telegram/telegram.controller.ts` | `telegram` | None | `fallback` | Telegram channel ingestions stay on NestJS. |
| `telegram-dl-import/telegram-dl-import.controller.ts` | `telegram/dl-import` | None | `fallback` | Telegram download imports stay on NestJS. |
| `telegram-dl-match/telegram-dl-match.controller.ts` | `telegram/dl-match` | None | `fallback` | Telegram matching stays on NestJS. |
| `tgmbase-search/tgmbase-search.controller.ts` | `tgmbase` | None | `fallback` | TGMBase message queries stay on NestJS. |
| `vk-friends/vk-friends.controller.ts` | `vk/friends` | None | `fallback` | VK friends export stays on NestJS. |
| `ok-friends/ok-friends.controller.ts` | `ok/friends` | None | `fallback` | OK friends export stays on NestJS. |
| `monitoring/monitoring.controller.ts` | `monitoring` | None | `fallback` | Legacy monitor status stays on NestJS. |
| `monitoring/monitoring-groups.controller.ts` | `monitoring/groups` | None | `fallback` | Legacy group monitoring metrics stay on NestJS. |

## Removed / Outdated Elements

- `scripts/smoke-fastapi-*.sh` -> `removed` (replaced with reliable integration tests and comprehensive manual HTTP check specifications in `docs/MANUAL_SMOKE_CHECKS.md`).

## Next Actions & Roadmap

1. Complete and run manual integration checks documented in `docs/MANUAL_SMOKE_CHECKS.md` to verify auth, tasks, admin users, VK ingestion, and content reads.
2. Maintain zero circular imports and ensure that all new gateway security checks rely on signature validation via JWKS.
3. Keep other fallback modules strictly isolated until specific microservices are designed and ready.
