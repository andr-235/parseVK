# Implementation Plan: Save Parsed VK Comments Only When Keywords Match

Branch: main
Created: 2026-06-22

## Settings
- Testing: yes
- Logging: verbose
- Docs: no

## Roadmap Linkage
Milestone: "VK Parsing Pipeline"
Rationale: This is a regression in the completed VK parsing and moderation flow: parsed raw VK comments must be filtered by moderation keywords before they become visible on the comments page.

## Problem Summary
Parsing can complete with VK comments collected, but the `/comments` page reads from `moderation_comments` through `front -> api-gateway -> moderation-service`, not directly from `vk_comments` or `content_comments`.

Required behavior:
- `vk-service` publishes raw `vk.comment_collected` events.
- `moderation-service` receives each raw comment, normalizes its text, runs active keywords and keyword forms against it, and saves a `ModerationComment` only when at least one keyword matches.
- Comments without keyword matches are not saved to `moderation_comments`, but their Kafka event is still marked processed to avoid repeated delivery loops.
- Saved comments include normalized identity fields and real `matched_keywords`, then `api-gateway` returns them to the frontend comments page.

Current gap:
- `ModerationCrudService.upsert_comment()` expects moderation-ready fields such as `external_key`, `post_external_key`, and `matched_keywords`.
- Existing keyword matching lives inside `RecalculationWorker._execute_recalculate()` and works on comments already stored in `moderation_comments`.
- The live projection path needs a reusable single-comment matcher so raw events can be filtered before persistence.

## Commit Plan
- **Commit 1** (after tasks 1-4): `fix(moderation): match raw vk comments before projection`
- **Commit 2** (after tasks 5-7): `test(comments): cover parsed keyword comment visibility`

## Tasks

### Phase 1: Confirm The Correct Moderation Contract
- [x] Task 1: Add focused failing tests for raw `vk.comment_collected` events in `services/moderation-service/tests/test_projection_consumer.py`.
  Expected behavior: a raw VK comment whose text matches an existing keyword is saved as one `ModerationComment` with `external_key="vk_<owner_id>_<post_id>_<comment_id>"`, `post_external_key="vk_<owner_id>_<post_id>"`, text, date, author, source, and populated `matched_keywords`.
  Expected behavior: a raw VK comment with no keyword matches is not saved, but the event is marked processed.
  Logging requirements: assert or inspect DEBUG event handling context, INFO successful projection with `matched_count`, INFO skipped projection with `matched_count=0`, and ERROR details for invalid required VK fields.
  Dependency notes: use real `Keyword`/`KeywordForm` fixtures or a repository-level fake that exercises the matcher; do not bypass matching with prebuilt `matched_keywords`.

### Phase 2: Reuse Keyword Matching For Live Projection
- [x] Task 2: Extract shared keyword candidate building and text matching from `services/moderation-service/app/modules/keywords/recalculation.py` into a small reusable module.
  Suggested file: `services/moderation-service/app/modules/keywords/matcher.py`.
  Expected behavior: expose functions/classes that load active `Keyword` records with `KeywordForm`, build regex candidates using the existing `normalize_for_keyword_match()` and `build_match_pattern()` behavior, and return sorted matched keyword words for one text string.
  Logging requirements: DEBUG log candidate count, normalized text presence, and matched keyword count; WARNING log malformed keyword/form data without dumping full comment text.
  Dependency notes: keep `RecalculationWorker` behavior unchanged by making it call the shared matcher instead of duplicating regex logic; keep new files under 100-150 lines.

- [x] Task 3: Add a moderation event mapper in `services/moderation-service/app/modules/moderation/comment_event_mapper.py`.
  Expected behavior: accept raw VK comment payload plus `matched_keywords`; return the exact persistence dict required by `ModerationCrudService.upsert_comment()`.
  Required fields: `external_key`, `post_external_key`, `text`, `date`, `author_vk_id`, `source="VK"`, `matched_keywords`.
  Edge cases: reject comments missing `id`, `owner_id`, or `post_id` with a clear validation error; tolerate missing text/date/from_id.
  Logging requirements: DEBUG log normalized IDs and matched keyword count; WARNING log skipped malformed comments without raw personal data; ERROR only for unexpected mapper failures.
  Dependency notes: mapper must not decide keyword matches itself and must not produce a persistence dict when `matched_keywords` is empty unless the caller explicitly overrides that policy.

### Phase 3: Wire Projection Policy
- [x] Task 4: Wire keyword matching and mapping into `services/moderation-service/app/modules/moderation/service.py`.
  Expected behavior: `handle_event()` handles only `vk.comment_collected` by running the shared matcher against raw comment text before persistence; if matches exist, save/update the `ModerationComment`; if no matches exist, do not save and still mark the event processed.
  Expected behavior: idempotency through `ProcessedEvent` remains intact for saved and skipped events.
  Logging requirements: DEBUG log event id/type and branch taken; INFO log saved projection with `event_id`, comment key, and `matched_count`; INFO log skipped no-match projection with ids and `matched_count=0`; ERROR log failed event projection with `event_id` and `event_type`.
  Dependency notes: keep router unchanged; avoid growing `crud_service.py`, which is already over the repo file-size limit.

### Phase 4: Projection Reliability
- [x] Task 5: Harden `services/moderation-service/app/modules/moderation/consumer.py` around commit/ack behavior.
  Expected behavior: successfully processed Kafka messages, including no-match skipped events, are committed or left to configured consumer behavior consistently; failed messages are logged with enough context to diagnose repeated projection failures.
  Logging requirements: INFO on consumer start/stop with topic and group; DEBUG per message event id/type; ERROR with exception and event metadata on failure.
  Dependency notes: do not change Kafka topic names or deployment configuration unless current code proves they are wrong.

### Phase 5: Integration Surface Check
- [x] Task 6: Verify that `api-gateway` and frontend mappers receive the fields they need from saved moderation comments.
  Expected behavior: `GET /api/v1/comments` returns only matched moderation comments with `id`, `text`, `owner_id`, `author_vk_id`, `created_at`, `is_read`, and optional enrichment.
  Logging requirements: if gateway code changes are needed, log backend fetch failures at WARNING and preserve request/correlation IDs.
  Dependency notes: only touch `services/api-gateway/app/modules/comments/*` or `front/src/shared/api/comments.ts` if the matched moderation record still cannot render correctly.

### Phase 6: Validation
- [x] Task 7: Run relevant checks and record exact results.
  Commands:
  - `cd services/moderation-service && uv run pytest tests/test_projection_consumer.py tests/test_moderation_service.py tests/test_keywords.py -v`
  - `cd services/api-gateway && uv run pytest tests/test_comments_service.py tests/test_comments_router.py -v`
  - `cd front && bun run test -- src/shared/api/__tests__/comments.test.ts`
  Manual smoke, if local compose is running:
  - Create or verify a keyword that appears in a parsed VK comment.
  - Run a VK parsing task and compare collected raw comments with `moderation_comments`.
  - Confirm only keyword-matched comments appear in `GET /api/v1/comments?offset=0&limit=25` and on the comments page.
  Logging requirements: capture failing command output exactly; do not report tests as passed unless they physically ran.
  Dependency notes: if `uv` or `bun` dependencies are missing, stop and report the missing runtime/dependency rather than inventing a pass.
