# ADR-0007: Source Integration vs Canonical Content Ownership

## Status
proposed

## Date
2026-07-17

## Context

ParseVK collects content from multiple sources: VKontakte (via VK API), Telegram (via Telethon), and WhatsApp/Max (via Wappi.pro). Each source has a dedicated microservice (vk-service, telegram-service, im-service) that handles source-specific API clients, credentials, polling, and task execution.

Currently, the ownership boundaries between these source services and `content-service` are unclear:

1. **Dual MonitoringGroup ownership:** Both `content-service` and `im-service` have full CRUD for `MonitoringGroup` entities, with nearly identical models and separate API endpoints exposed through the API Gateway.

2. **Incomplete IM message projections:** `im-service` publishes `im.message_collected` events with only identifiers (`messenger`, `messageId`, `chatId`), producing skeleton rows in `content-service` that lack text, author, content_url, and other message data.

3. **No Telegram event contract:** `telegram-service` has no Kafka integration and does not publish any events to `content-service`.

4. **API Gateway dual proxying:** `/api/v1/monitoring/groups` routes to `content-service` while `/api/v1/im/groups` routes to `im-service` — both serve overlapping monitoring group functionality.

5. **Content-service role ambiguity:** `content-service` simultaneously acts as VK canonical storage, IM read model, and monitoring configuration owner — conflicting roles that violate bounded context principles.

### Current Architecture (Before)

```
Source Services (own acquisition + storage):
  vk-service → publishes full snapshots → parsevk.vk.events → content-service (VK models OK)
  im-service → publishes identifiers only → parsevk.im.events → content-service (skeleton rows)
  telegram-service → no events → (no integration with content-service)

Dual ownership:
  content-service.MonitoringGroup (full CRUD)  ←  /api/v1/monitoring/groups
  im-service.MonitoringGroup (full CRUD)       ←  /api/v1/im/groups
```

## Decision

We establish a clear ownership split between source services and content-service:

### Ownership Model

**Source services (vk-service, im-service, telegram-service) own:**
- Source-specific API clients, credentials, and authentication
- Polling/import cursors and integration state
- Task execution state, retries, and job management
- Raw ingestion state and deduplication
- Source-specific operational configuration (e.g., Wappi polling config)
- Publishing content snapshot events via Kafka

**content-service owns:**
- Normalized product projections of collected content from all sources
- Canonical write models for each source type:
  - VK: `ContentGroup`, `ContentAuthor`, `ContentPost`, `ContentComment`
  - Messaging: `ContentConversation`, `ContentActor`, `ContentMessage` (to be created)
- Unified content search via `ContentSearchDocument` read model
- Idempotent event consumption (already implemented via `ProcessedEvent` table)

### Event Contract Requirements

**VK events (already compliant — model for others):**
- `vk.post_collected`: payload includes complete post data (`taskId`, `vkOwnerId`, `vkPostId`, `post`)
- `vk.comment_collected`: payload includes complete comment data
- `vk.group_collected` / `vk.author_collected`: full entity snapshots

**IM events (must be expanded):**
- Current `im.message_collected` payload: `{messenger, messageId, chatId}` — insufficient
- Target: complete message snapshot including text, author, content_url, content_type, metadata, timestamps
- New event version (`event_version: 2`) for the expanded contract

**Telegram events (do not exist yet — to be introduced):**
- New topic `parsevk.telegram.events` (or extend shared messaging contract)
- Content snapshot events similar to IM expanded contract
- Integration planning deferred to a separate PR

### MonitoringGroup Ownership

- `MonitoringGroup` belongs exclusively to `im-service`, with FK to `ImGroup` (`MonitoringGroup.im_group_id` → `ImGroup.id`)
- `content-service` must remove its duplicate `MonitoringGroup` model, CRUD, and `sync=true` behavior
- `MonitoringGroup` is global (no `user_id`) and created only by explicit user action
- Manual monitoring by external chat ID must first resolve or create a valid `ImGroup`; orphan monitoring rows are prohibited

### Public API Boundaries

| Endpoint | Owner | Purpose |
|----------|-------|---------|
| `/api/v1/im/chats` | im-service | Discovered Wappi chats |
| `/api/v1/monitoring/groups` | im-service | Monitoring configuration |
| `/api/v1/content/search` | content-service | Unified content search |

### Code Evidence

The following files in the codebase demonstrate the current state:

- **Partial IM event:** `services/im-service/app/modules/outbox/service.py:16` — payload only `{"messenger", "messageId", "chatId"}`
- **Skeleton consumer:** `services/content-service/app/modules/im_events/service.py:45-54` — `upsert_message` sets only 3 fields
- **Complete VK event (reference):** `services/vk-service/app/services/domain_events_service.py:47` — payload includes full `post` dict
- **Duplicate MonitoringGroup:** `services/content-service/app/db/models.py:146` and `services/im-service/app/db/models.py:120` — nearly identical models
- **Dual proxying:** `services/api-gateway/app/modules/monitoring/` (→ content-service) and `services/api-gateway/app/modules/im/` (→ im-service)

## Consequences

### Positive
- Clear bounded contexts — no cross-service DB access, each service owns its database
- VK already follows the correct event-driven flow and serves as the reference pattern
- MonitoringGroup has a single source of truth in im-service
- Unified search can return VK posts/comments and messaging messages through one public API (`/api/v1/content/search`)
- Clear target schema for messaging projections: `ContentConversation`, `ContentActor`, `ContentMessage` in content-service

### Negative
- IM event contract (`im.message_collected`) must be expanded from identifier-only to full message snapshot — requires coordinated changes in im-service (producer) and content-service (consumer)
- content-service must remove its duplicate MonitoringGroup model, CRUD endpoints, and `sync=true` behavior — coordinated migration with im-service (downstream PR-B)
- Telegram content events do not exist yet — a new event contract and topic are needed, deferred to a separate PR
- API Gateway routing for `/api/v1/monitoring/groups` must be redirected from content-service to im-service

### Migration Path

The following PR sequence will implement this ADR:

| PR | Scope | Services |
|----|-------|----------|
| PR-A | **This ADR** — document the decision | docs |
| PR-B1..B5 | Monitoring ownership cleanup — remove duplicate MonitoringGroup from content-service | content-service, im-service |
| PR-C | Unified content search — create `ContentSearchDocument` read model | content-service |
| PR-D | IM event contract v2 — expand `im.message_collected` payload | im-service, content-service |
| PR-F | Notifier rename/cleanup — split user-facing feed state from polling cursors | im-service |

## Alternatives considered

### Content-service as VK-only storage
**Rejected.** content-service already stores IM messages (`ImMessage` model) and defines itself in its README as "storage, search and retrieval of content from various sources." Restricting it to VK-only would require migrating existing IM data and contradict the established multi-source vision.

### Im-service as canonical product owner of WhatsApp/Max content
**Rejected.** im-service is a Wappi integration bounded context — its responsibility is acquisition and source-specific operational state, not normalized product projections. Making im-service the product owner would duplicate the content-service's projection infrastructure and violate the bounded context principle.

### Shared database between services
**Rejected.** Violates the fundamental architecture principle of database-per-service. Would create tight coupling, make independent deployments impossible, and complicate schema evolution across teams.

## Links
- Issue: https://github.com/andr-235/parseVK/issues/280
- PR: (TBD — filled after PR creation)
