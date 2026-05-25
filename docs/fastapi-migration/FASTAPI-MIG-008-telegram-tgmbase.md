# FASTAPI-MIG-008: Telegram/TGMBase migration inventory

Issue: #152

Status: first safe slice implemented in FastAPI API Gateway.

## Scope

Domains in scope:

- `telegram/*`
- `telegram/dl-import/*`
- `telegram/dl-match/*`
- `tgmbase/*`
- `api/src/telegram*`
- `api/src/tgmbase-search`
- frontend pages, hooks and API clients for Telegram/TGMBase

Non-goals for this phase:

- Do not remove NestJS fallback.
- Do not migrate write/session/auth flows yet.
- Do not move Telegram session strings, auth payloads or API credentials into frontend state.
- Do not add real secrets to docs, env examples, fixtures or tests.

## Current endpoint map

All legacy routes below are served by NestJS under the existing frontend `API_URL` fallback.

| Area | Method | Route | Current handler | Contract summary | Target phase |
| --- | --- | --- | --- | --- | --- |
| Telegram auth | `GET` | `/api/telegram/settings` | `api/src/telegram/telegram-auth.controller.ts` | Returns saved Telegram settings without exposing session string. | Phase 2 |
| Telegram auth | `PATCH` | `/api/telegram/settings` | `TelegramAuthController.updateSettings` | Accepts `TelegramSettingsDto`: `phone`, `apiId`, `apiHash`. Sensitive request body. | Phase 2 |
| Telegram auth | `GET` | `/api/telegram/session` | `TelegramAuthController.getCurrentSession` | Returns current session status/metadata. Must never return raw session string. | Phase 2 |
| Telegram auth | `POST` | `/api/telegram/session/start` | `TelegramAuthController.startSession` | Starts Telegram login; request can include session settings. Sensitive flow. | Phase 2 |
| Telegram auth | `POST` | `/api/telegram/session/confirm` | `TelegramAuthController.confirmSession` | Confirms `phoneCode`/`password`; writes session data. Highly sensitive flow. | Phase 2 |
| Telegram sync | `POST` | `/api/telegram/sync` | `api/src/telegram/telegram.controller.ts` | Accepts `SyncTelegramChatDto`: `identifier`, `limit`; returns `TelegramSyncResultDto`. | Phase 3 |
| Telegram sync | `POST` | `/api/telegram/discussion-authors/sync` | `TelegramController.syncDiscussionAuthors` | Accepts `TelegramDiscussionSyncDto`: identifier, mode, message/date/limit filters. | Phase 3 |
| Telegram export | `GET` | `/api/telegram/export/:chatId` | `TelegramController.exportChat` | Streams XLSX export for synced chat members. | Phase 3 |
| DL import | `POST` | `/api/telegram/dl-import/upload` | `api/src/telegram-dl-import/telegram-dl-import.controller.ts` | Multipart `files[]`; chunks handled by frontend. Creates import batch/files/contacts. | Phase 4 |
| DL import | `GET` | `/api/telegram/dl-import/files` | `TelegramDlImportController.getFiles` | Query `TelegramDlImportFilesQueryDto`; returns import files. | Phase 4 |
| DL import | `GET` | `/api/telegram/dl-import/contacts` | `TelegramDlImportController.getContacts` | Query by fileName, telegramId, username, phone, limit, offset. | Phase 4 |
| DL match | `POST` | `/api/telegram/dl-match/runs` | `api/src/telegram-dl-match/telegram-dl-match.controller.ts` | Starts match run, currently backed by BullMQ queue/worker pieces. | Phase 5 |
| DL match | `GET` | `/api/telegram/dl-match/runs` | `TelegramDlMatchController.getRuns` | Lists match runs. | Phase 5 |
| DL match | `GET` | `/api/telegram/dl-match/runs/:id` | `TelegramDlMatchController.getRunById` | Returns one run status/counters. | Phase 5 |
| DL match | `GET` | `/api/telegram/dl-match/runs/:id/results` | `TelegramDlMatchController.getResults` | Query `TelegramDlMatchResultsQueryDto`; returns match rows. | Phase 5 |
| DL match | `GET` | `/api/telegram/dl-match/runs/:id/results/:resultId/messages` | `TelegramDlMatchController.getResultMessages` | Returns grouped TGMBase chat messages for a result. | Phase 5 |
| DL match | `POST` | `/api/telegram/dl-match/runs/:id/excluded-chats` | `TelegramDlMatchController.excludeChat` | Body `TelegramDlMatchExcludedChatDto`: `peerId`. Idempotency-sensitive. | Phase 5 |
| DL match | `DELETE` | `/api/telegram/dl-match/runs/:id/excluded-chats/:peerId` | `TelegramDlMatchController.restoreChat` | Restores excluded chat. Idempotency-sensitive. | Phase 5 |
| DL match | `GET` | `/api/telegram/dl-match/runs/:id/export` | `TelegramDlMatchController.exportRun` | Streams XLSX export. | Phase 5 |
| TGMBase search | `POST` | `/api/tgmbase/search` | `api/src/tgmbase-search/tgmbase-search.controller.ts` | Body `TgmbaseSearchRequestDto`; returns `TgmbaseSearchResponseDto`. | Phase 6 |
| TGMBase progress | websocket | `/tgmbase-search` namespace | `api/src/tgmbase-search/tgmbase-search.gateway.ts` | `subscribe`, emits `tgmbase-search-progress`. | Phase 6 |
| Migration slice | `GET` | `/api/v1/telegram-tgmbase/capabilities` | `services/api-gateway/app/modules/telegram_tgmbase/router.py` | Authenticated read-only migration capability/status contract. | Done in phase 1 |

## Frontend entrypoints

| Entrypoint | Files | Current backend base | Notes |
| --- | --- | --- | --- |
| Telegram sync page | `front/src/pages/Telegram.tsx`, `front/src/components/telegram/*`, `front/src/hooks/telegram/*`, `front/src/api/telegram/telegram.api.ts` | `API_URL` legacy `/api` | Session start/confirm requests contain sensitive auth data and remain fallback-only. |
| Telegram settings card | `front/src/components/settings/TelegramCard.tsx`, `front/src/hooks/settings/useTelegramSettings.ts` | `API_URL` legacy `/api` | Handles `phone`, `apiId`, `apiHash`; must not persist sensitive values beyond form state. |
| DL upload page | `front/src/pages/TelegramDlUpload.tsx`, `front/src/components/telegram-dl-upload/*`, `front/src/hooks/telegram-dl-upload/*`, `front/src/api/telegram-dl-upload/telegramDlUpload.api.ts` | `API_URL` legacy `/api` | Multipart upload, contacts paging, match run polling/export. |
| TGMBase search page | `front/src/pages/TgmbaseSearch.tsx`, `front/src/components/tgmbase-search/*`, `front/src/hooks/tgmbase-search/*`, `front/src/api/tgmbase-search/tgmbaseSearch.api.ts` | `API_URL` legacy `/api`; websocket uses `VITE_API_WS_URL` | Supports batch query input and progress websocket. |
| Sidebar navigation | `front/src/components/common/Sidebar/constants.ts` | N/A | Telegram section links: `/telegram`, `/tgmbase-search`, `/telegram/dl-upload`. |

## Backend modules and models

| Area | Main files | Storage/dependencies |
| --- | --- | --- |
| Telegram auth/session | `api/src/telegram/telegram-auth.service.ts`, `repositories/telegram-auth.repository.ts`, `interfaces/telegram-auth-repository.interface.ts` | Prisma models `TelegramSession`, `TelegramSettings`; Telegram session strings and auth flow state. |
| Telegram sync/export | `api/src/telegram/telegram.service.ts`, `services/telegram-client-manager.service.ts`, `telegram-chat-sync.service.ts`, `telegram-participant-collector.service.ts`, `telegram-excel-exporter.service.ts` | Prisma models `TelegramChat`, `TelegramUser`, `TelegramChatMember`; Telegram client library; XLSX export. |
| Identifier/discussion resolution | `telegram-identifier-resolver.service.ts`, `telegram-discussion-resolver.service.ts`, `telegram-comment-author-collector.service.ts` | Telegram API access through authenticated client; identifiers can be username, numeric id or internal id. |
| DL import | `api/src/telegram-dl-import/*`, parser and controller tests | TGMBase Prisma models `DlImportBatch`, `DlImportFile`, `DlContact`; file hash/replacement behavior. |
| DL match | `api/src/telegram-dl-match/*`, `queues/*`, exporter | TGMBase Prisma models `DlMatchRun`, `DlMatchResult`, `DlMatchResultChat`, `DlMatchResultMessage`; BullMQ queue `telegram-dl-match`. |
| TGMBase search | `api/src/tgmbase-search/*` | Read queries over TGMBase Prisma models `user`, `group`, `supergroup`, `channel`, `message`; websocket progress. |
| FastAPI gateway slice | `services/api-gateway/app/modules/telegram_tgmbase/*` | No database. Returns static migration capability/status with auth guard. |
| Shared redaction | `libs/py/common/common/logging.py` | Shared sensitive-key detection and recursive `redact_sensitive` helper for Python services. |

## Legacy scenario to target scenario

| Legacy scenario | Target FastAPI/gateway scenario | Fallback status |
| --- | --- | --- |
| Read migration capabilities | Gateway returns `/api/v1/telegram-tgmbase/capabilities` with typed response and auth. | Migrated in phase 1. |
| TGMBase search | Gateway exposes `/api/v1/tgmbase/search` and proxies to a future Telegram/TGMBase service or dedicated read model. | NestJS `/api/tgmbase/search` remains active. |
| TGMBase progress websocket | Gateway keeps websocket routing stable, later backs it with FastAPI service events. | NestJS `/tgmbase-search` namespace remains active. |
| Telegram settings/session | Gateway terminates auth and calls Telegram service; raw session/auth payload never leaves service boundary. | NestJS remains active. |
| Telegram sync/export | Gateway starts async tasks and exposes status/download; Telegram service owns client orchestration. | NestJS remains active. |
| DL import | Gateway accepts upload metadata and forwards file processing to worker pipeline with batch idempotency. | NestJS remains active. |
| DL match | Gateway creates match jobs and reads run/result state; worker owns heavy matching. | NestJS remains active. |

## Target service boundary

### Telegram service

- Owns Telegram API client lifecycle, session orchestration and sync/export logic.
- Stores session strings only in backend storage; never returns them to frontend or logs.
- Accepts settings/auth inputs through explicit Pydantic schemas.
- Redacts `session`, `sessionString`, `authKey`, `phone`, `phoneCode`, `password`, `token`, `cookie`, `apiHash`, and `apiId` in logs/events/errors.

### Telegram auth/session flow

- Gateway only validates user auth, request shape and CSRF where applicable.
- Telegram service owns login transaction state and session persistence.
- Confirm/start errors must be sanitized before returning to gateway.
- Rollback path: keep frontend `telegramService` on legacy `API_URL` until the whole session flow is migrated.

### DL import pipeline

- Boundary is one import batch.
- Upload stage creates immutable file records with a file hash and replacement link when needed.
- Contacts ingestion must be retryable by file/batch id.
- Duplicate protection should use file hash plus source row identity or an explicit idempotency key.
- Sensitive contact fields such as `phone` are data, not credentials, but logs must avoid dumping whole rows.

### DL match pipeline

- Boundary is one match run.
- `POST /runs` should enqueue a job and return quickly.
- Worker retries must be bounded and leave a sanitized `error`.
- Chat exclude/restore operations must be idempotent by `(runId, peerId)`.
- Export should read persisted results, not recompute matches.

### TGMBase search API

- Read-only endpoint with body contract equivalent to `TgmbaseSearchRequestDto`:
  - `queries: string[]`
  - optional `batchId`
  - per-query classification: `telegramId`, `username`, `phoneNumber`, `invalid`
- Response keeps current frontend shape: `items`, `summary`, per-item `messagesPage`.
- Pagination/filtering should be explicit for message pages; batch search should cap query count and result depth.
- Search logs must include counts/status only, not raw phone lists or full response payloads.

### Gateway

- Migrated now: `/api/v1/telegram-tgmbase/capabilities`.
- Safe next switch: read-only TGMBase search after a dedicated backend service or data client exists.
- Fallback stays for session/auth, sync/export, DL import, DL match and websocket progress until each flow has tests and rollback docs.

## Security rules

- Never log Telegram secrets, session strings, tokens, cookies, auth payloads or raw Telegram responses.
- Use `common.logging.redact_sensitive` before emitting structured logs/events with external payload fragments.
- Do not persist `phoneCode`, `password` or session transaction internals in frontend state.
- `.env.example`, service env examples and docs must use placeholder-only values.
- New tests cover `common.logging.is_sensitive_key` and nested redaction for Telegram/session fields.

## Env and compose notes

No new environment variables are required for the phase 1 gateway slice.

Existing legacy values:

- `api/.env.example`: `TGMBASE_DATABASE_URL` placeholder for NestJS/TGMBase Prisma.
- root `.env.example`: `VITE_API_URL`, `VITE_GATEWAY_API_URL`, `VITE_API_WS_URL` placeholders.
- `services/api-gateway/.env.example`: gateway URLs/token placeholders.
- `docker-compose.yml` and `docker-compose.deploy.yml`: API gateway service already receives gateway env values; NestJS backend still owns `TGMBASE_DATABASE_URL`.

Rollback:

- Leave frontend Telegram/TGMBase clients pointed at `API_URL` legacy routes.
- Remove or stop calling `/api/v1/telegram-tgmbase/capabilities`; no storage/data migration is involved.
- NestJS fallback remains the source of truth for all production Telegram/TGMBase flows.

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Raw Telegram auth/session payload leaks in logs | Credential compromise | Shared redaction helper plus tests; never log request bodies for auth/session flows. |
| Partial session migration breaks login | User cannot sync/export Telegram data | Migrate session flow as one tested unit; keep fallback until parity is proven. |
| DL import retries duplicate contacts | Incorrect match results and inflated counts | Introduce idempotency key and file/row duplicate constraints before worker migration. |
| DL match HTTP request stays long-running | Timeouts and poor observability | Keep/extend queue-based worker boundary. |
| TGMBase search result shape drift | Frontend regressions | Contract tests against existing TS DTO shape before switching frontend. |
| Websocket progress namespace drift | UI progress freezes | Keep namespace compatibility or add frontend feature flag during migration. |

## Phased migration plan

1. Phase 1: inventory and safe gateway slice.
   - Add this document.
   - Add `/api/v1/telegram-tgmbase/capabilities`.
   - Add redaction tests and helper coverage.
2. Phase 2: Telegram settings/session.
   - Write FastAPI schemas and contract tests.
   - Move auth/session orchestration behind Telegram service boundary.
   - Keep raw session storage backend-only.
3. Phase 3: Telegram sync/export.
   - Convert sync to async task/status boundary.
   - Preserve XLSX export contract.
4. Phase 4: DL import.
   - Add batch/file idempotency tests.
   - Move parser/worker pieces behind FastAPI service boundary.
5. Phase 5: DL match.
   - Preserve queued run model.
   - Add explicit retry/idempotency tests for run creation and exclude/restore.
6. Phase 6: TGMBase search.
   - Add read-only FastAPI search endpoint and response schema.
   - Switch frontend client only after contract tests pass.
   - Keep NestJS fallback available during rollout.

## Phase 1 validation status

Implemented files:

- `services/api-gateway/app/modules/telegram_tgmbase/router.py`
- `services/api-gateway/app/modules/telegram_tgmbase/schemas.py`
- `services/api-gateway/tests/test_telegram_tgmbase_gateway.py`
- `libs/py/common/common/logging.py`
- `libs/py/common/tests/test_logging_redaction.py`

Validation commands used during implementation:

```bash
uv run --project services/api-gateway --extra test pytest services/api-gateway/tests/test_telegram_tgmbase_gateway.py -q
uv run --project libs/py/common --with pytest pytest libs/py/common/tests/test_logging_redaction.py -q
```
