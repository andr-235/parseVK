# Implementation Plan: Display Moderated Comments On The Comments Page

Branch: main
Created: 2026-06-22

## Settings
- Testing: yes
- Logging: verbose
- Docs: no

## Roadmap Linkage
Milestone: "Content Moderation Pipeline"
Rationale: The comments page is a core moderation surface and must show comments that passed moderation projection into `moderation_comments`.

## Problem Summary
The `/comments` page should display comments after moderation, but the visible table can stay empty even when VK parsing collected comments. The page does not read raw VK/content comments directly. The runtime path is:

`front /comments -> api-gateway /api/v1/comments -> moderation-service /internal/moderation/comments -> moderation_comments`

Required behavior:
- VK parsing emits `vk.comment_collected` events for raw comments.
- `moderation-service` projects only moderated comments into `moderation_comments`.
- `api-gateway` returns those moderation records in the frontend DTO shape.
- The frontend table shows the returned comments and does not hide them through stale local filters or mapping mismatches.

Primary risks to verify:
- `vk-service` saves comments locally but its outbox publisher does not publish `vk.comment_collected` events to Kafka.
- Projection never writes `moderation_comments` because comment text does not match configured keywords, because the moderation Kafka consumer is disabled/not committing correctly, or because event fields are invalid.
- The moderation API returns records but the gateway mapper drops identity/date fields or fails enrichment.
- The frontend receives records but local filtering/status mapping makes the current table page appear empty.

## Commit Plan
- **Commit 1** (after tasks 1-5): `fix(moderation-service): project moderated comments for display`
- **Commit 2** (after tasks 6-8): `test(comments): cover moderated comments page flow`

## Tasks

### Phase 1: Reproduce And Pin The Failing Contract
- [x] Task 1: Add an end-to-end style regression test for the moderation projection contract.
  Files: `services/moderation-service/tests/test_projection_consumer.py`, possibly `services/moderation-service/tests/test_content_api.py`.
  Expected behavior: a `vk.comment_collected` event with text matching a configured keyword creates one `ModerationComment`, marks the event processed, and `GET /internal/moderation/comments` returns that record through the same service/router path used by the comments page.
  Expected behavior: a no-keyword-match comment is marked processed but is not returned on the comments API.
  Logging requirements: assert or inspect DEBUG event id/type logs, INFO saved/skipped projection logs, and ERROR invalid-field logs without raw personal data.
  Dependency notes: use real matcher candidates or a repository fake; do not bypass moderation matching by prebuilding a saved comment.

### Phase 2: Verify Projection Input From VK Events
- [x] Task 2: Audit and, if needed, fix the VK comment event payload mapping into moderation persistence fields.
  Files: `services/vk-service/app/services/domain_events_service.py`, `services/moderation-service/app/modules/moderation/comment_event_mapper.py`, `services/moderation-service/app/modules/moderation/service.py`.
  Expected behavior: `external_key="vk_<owner_id>_<post_id>_<comment_id>"`, `post_external_key="vk_<owner_id>_<post_id>"`, `author_vk_id`, `date`, `text`, `source="VK"`, and non-empty `matched_keywords` survive from raw event to DB upsert.
  Edge cases: reject missing `id`, `owner_id`, or `post_id`; tolerate missing `text`, `date`, or `from_id` without breaking the consumer.
  Logging requirements: DEBUG normalized ids and candidate count; INFO saved projection with comment key and `matched_count`; WARNING skipped malformed event metadata; ERROR unexpected mapper failures with event id/type.
  Dependency notes: keep mapper keyword-free and keep DB access inside repository classes.

### Phase 3: Verify Keyword Match Policy For Displayed Comments
- [x] Task 3: Confirm moderated comments are saved only when configured keywords or keyword forms match the raw comment text.
  Files: `services/moderation-service/app/modules/keywords/matcher.py`, `services/moderation-service/app/modules/keywords/repository.py`, `services/moderation-service/app/modules/keywords/recalculation.py`, `services/moderation-service/tests/test_keywords.py`.
  Expected behavior: matcher handles normalized Russian text, forms, phrase boundaries, punctuation, and empty text deterministically.
  Expected behavior: repository loads keyword candidates with forms, while matcher logic remains repository-free.
  Logging requirements: DEBUG candidate count and matched count; WARNING malformed keyword/form data without dumping full comment text.
  Dependency notes: the current `Keyword` model has no `active` or `enabled` flag; do not plan or implement active-keyword filtering unless a separate schema change is explicitly added. Respect the rule that all database queries go through Repository classes.

### Phase 4: Verify VK Event Publication
- [x] Task 4: Verify `vk-service` publishes collected comments from outbox to Kafka.
  Files: `services/vk-service/app/services/domain_events_service.py`, `services/vk-service/app/tasks/outbox_worker.py`, `services/vk-service/app/main.py`, `services/vk-service/tests/test_vk_outbox.py`.
  Expected behavior: after parsing saves a raw comment, an `outbox_events` row with `event_type="vk.comment_collected"` is created with a stable dedupe key and payload containing `comment`, `vkOwnerId`, `vkPostId`, and `vkCommentId`.
  Expected behavior: when `VK_SERVICE_OUTBOX_PUBLISH_ENABLED=true`, the publisher sends the event to `parsevk.vk.events` and marks the outbox row as `published`; when disabled, health/logs make the disabled state visible.
  Logging requirements: INFO publisher start/disabled state; DEBUG published event id/type/topic when available; ERROR publish failures with event id/type and retry context.
  Dependency notes: this task must be validated before changing moderation consumer behavior, because moderation cannot display comments that were never published.

### Phase 5: Harden Moderation Consumer Delivery Semantics
- [x] Task 5: Verify the moderation Kafka consumer starts, processes, commits, and retries consistently.
  Files: `services/moderation-service/app/modules/moderation/consumer.py`, `services/moderation-service/app/main.py`.
  Expected behavior: successfully handled events, including no-match skipped events, are committed; failed events are not committed and are logged with offset, event id, event type, and correlation id when available.
  Expected behavior: startup respects `settings.kafka_consumer_enabled` and logs whether the projection consumer is active.
  Logging requirements: INFO consumer start/stop and disabled state; DEBUG per-message event id/type/offset; ERROR failure with metadata and traceback.
  Dependency notes: do not change Kafka topic names or deployment configuration unless current code proves they are wrong.

### Phase 6: Preserve API Gateway Contract To Frontend
- [x] Task 6: Add/adjust gateway tests proving moderated records are returned in the frontend DTO shape.
  Files: `services/api-gateway/app/modules/comments/service.py`, `services/api-gateway/app/modules/comments/mappers/comment_mapper.py`, `services/api-gateway/tests/test_comments_service.py`, `services/api-gateway/tests/test_comments_router.py`.
  Expected behavior: `GET /api/v1/comments` returns `items[]` with `id`, `text`, `owner_id`, `author_vk_id`, `created_at`, `is_read`, optional `author`, optional `group`, plus total/stats fields.
  Expected behavior: `post_external_key="vk_<owner_id>_<post_id>"` is parsed into `owner_id`, so group fallback and enrichment work even if backend does not include explicit `owner_id`.
  Expected behavior: moderation upstream 4xx responses and unavailable-service errors are translated by the router to the correct API Gateway HTTP status instead of leaking as 500.
  Logging requirements: WARNING for content-service enrichment failures with request/correlation context; WARNING for upstream moderation HTTP errors; ERROR for moderation-service unavailable with request/correlation context; no ERROR for optional enrichment miss.
  Dependency notes: keep gateway service using `forward_service_request()` and do not put business logic in routers.

### Phase 7: Prevent Frontend From Hiding Returned Moderated Comments
- [x] Task 7: Add/adjust frontend tests for the comments API mapper and table empty state.
  Files: `front/src/shared/api/comments.ts`, `front/src/shared/api/__tests__/comments.test.ts`, `front/src/components/widgets/table/CommentsTable.tsx`, `front/src/pages/comments/__tests__/CommentsPage.test.tsx`.
  Expected behavior: returned moderation records render as table rows when `items` is non-empty.
  Expected behavior: missing optional author/group/date fields use safe fallbacks instead of dropping rows.
  Expected behavior: group filter options are derived from loaded comments, or the filtered-empty state clearly says current filters hide existing server rows. Static options such as `Группа А`, `Группа Б`, `Группа В` must not make valid moderated rows appear missing without explanation.
  Logging requirements: keep frontend warnings for malformed dates or missing identity, but avoid noisy warnings for valid fallback cases.
  Dependency notes: do not add fake fallback data; empty UI must reflect real API state.

### Phase 8: Validation And Runtime Diagnostics
- [x] Task 8: Run focused checks and document exact runtime verification commands.
  Commands:
  - `cd services/vk-service && uv run pytest tests/test_vk_outbox.py -v`
  - `cd services/moderation-service && uv run pytest tests/test_projection_consumer.py tests/test_content_api.py tests/test_moderation_service.py tests/test_keywords.py -v`
  - `cd services/moderation-service && uv run ruff check app/modules/moderation app/modules/keywords tests/test_projection_consumer.py tests/test_content_api.py tests/test_keywords.py`
  - `cd services/api-gateway && uv run pytest tests/test_comments_service.py tests/test_comments_router.py -v`
  - `cd front && bun run test -- src/shared/api/__tests__/comments.test.ts src/pages/comments/__tests__/CommentsPage.test.tsx`
  Manual smoke, if local compose is running:
  - Verify `vk-service` logs show outbox publisher active and `moderation-service` logs show projection consumer active.
  - Run a VK parsing task with a comment containing an active keyword.
  - Query `vk-db.outbox_events` for `event_type='vk.comment_collected'`, `dedupe_key`, `payload`, and `status`.
  - Query `moderation_comments` for the generated `vk_<owner_id>_<post_id>_<comment_id>` key.
  - Call `GET /api/v1/comments?offset=0&limit=25` and confirm the same record appears on the comments page.
  - If comments are missing, compare counts at each hop: raw `vk_comments`, `vk-service` outbox, Kafka consumer logs, `processed_events`, `moderation_comments`, `GET /internal/moderation/comments`, and `GET /api/v1/comments`.
  Logging requirements: capture failing command output exactly; never report tests as passed unless they physically ran.
  Dependency notes: if local Kafka/Postgres compose is unavailable, report automated test results and provide the exact manual commands left for runtime smoke.
