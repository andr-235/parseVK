# Backend Migration Status

Audit date: 2026-05-22.

This document is the current source of truth for the NestJS to FastAPI backend
migration. The old `api/` service remains a fallback until each domain is
explicitly switched off.

## Status Legend

- `done` - the public frontend path uses FastAPI/gateway for the stated scenario.
- `partial` - FastAPI exists, but some scenarios remain on NestJS.
- `fallback` - frontend still uses NestJS.
- `not-started` - no new FastAPI domain exists yet.

## Frontend Public Paths
* **Auth**: Routed through FastAPI API-Gateway `/api/v1/auth/*`.
* **Tasks**: Routed through FastAPI API-Gateway `/api/v1/tasks/*` (except some websockets).
* **Content Reads (basic)**: Routed through FastAPI API-Gateway `/api/v1/content/*` for unfiltered `comments`, `authors`, and `groups`.
* **All other endpoints**: Routed through the old NestJS fallback `/api/v1/*` implicitly.

## Endpoint Map

| Old NestJS endpoint | New service / endpoint | Status | Remaining work |
| --- | --- | --- | --- |
| `POST /auth/login`, `POST /auth/refresh`, `POST /auth/change-password` | `api-gateway /api/v1/auth/*` -> `identity-service /internal/auth/*` | done | Admin user management remains separate. |
| `POST /tasks/parse`, `GET /tasks`, `GET /tasks/:id`, task actions | `api-gateway /api/v1/tasks/*` -> `tasks-service /internal/tasks/*` | done | Old `/tasks` websocket updates are not migrated. |
| `GET/POST /tasks/automation/*` | `api-gateway /api/v1/tasks/automation/*` -> `tasks-service` | done | Verify production scheduling separately. |
| VK parsing execution | `vk-service` consumes `parsevk.tasks.events`, callbacks to `tasks-service` | partial | Production VK token flow and end-to-end verification need a replacement for the removed shell smoke scripts. |
| VK read models | `api-gateway /api/v1/content/*` -> `content-service /internal/content/*` | partial | Read API is basic: no full legacy filters, search, read status, or keyword matches. |
| `GET /comments`, `GET /comments/cursor` | Unfiltered reads use `/api/v1/content/comments`; filtered reads stay on `/comments` | partial | `readStatus`, keyword/search filters, `PATCH /comments/:id/read`, `POST /comments/search`. |
| `GET /authors`, `GET /authors/:vkUserId` | Unfiltered reads/details use `/api/v1/content/authors`; filtered reads stay on `/authors` | partial | `refresh`, `delete`, `verify`, filters/sort, photo-analysis summary enrichment. |
| `POST /comments/search` | NestJS `comments-search` | fallback | Design search in `content-service` or a dedicated search service. |
| `keywords/*` | No new service | fallback | Migrate keyword CRUD/forms/recalculation. |
| `groups/*` | Basic `/api/v1/content/groups` read-only exists | partial | Save/upload/delete/search region remain on NestJS. |
| `watchlist/*` | No new service | fallback | Needs a watchlist + monitoring migration slice. |
| `photo-analysis/*` | No new service | fallback | Needs analysis/moderation service design. |
| `telegram/*`, `telegram/dl-import/*`, `telegram/dl-match/*`, `tgmbase/*` | No new service | fallback | Large Telegram/TGMBase migration slice. |
| `listings/*`, `data/import` | No new service | fallback | Separate listings/import service. |
| `vk/friends/*`, `ok/friends/*` | No new service | fallback | Separate friends-export service. |
| `admin/users/*` | No new gateway/admin API | fallback | Extend `identity-service` admin endpoints. |
| `metrics`, `monitoring/*` | Old NestJS/monitoring stack | fallback | Decide what moves into services and what stays infrastructure. |

## Next Slice

1. Replace the removed shell smoke scripts with reliable integration tests or documented manual HTTP checks.
2. Expand `content-service` for `comments/authors` after basic read paths are verified.
3. Keep write/admin operations on NestJS until each has its own design.
