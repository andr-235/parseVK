# Issue #446 — CONTENT Receipts & Exactly-Once Application

## Context

Issue #446 moves `content-service` from legacy VK projection events to the staged canonical ingestion parts introduced in P3A. The staged producer emits deterministic `WireEvent` messages with event types `vk.ingestion.post-part-prepared` and `vk.ingestion.comment-part-prepared`. The part UUID is derived from batch id, part kind, staging/packing/event contract versions, and part index. Producer headers carry `event-id`, `event-type`, `batch-id`, and `wire-digest`.

## Invariants

- Validate identity, event contract/version, part metadata and wire digest before canonical mutation.
- Persist/look up a `content_ingestion_receipts` record before consulting generic `processed_events`.
- The same deterministic identity with the same immutable content is a replay, not a second mutation.
- The same deterministic identity with different content/digest is an identity collision and is quarantined before canonical mutation.
- Canonical mutation, receipt state, generic processed marker, and deterministic ACK/command outbox records share one database transaction.
- Kafka offsets are committed only after that database transaction commits successfully.
- Staged projection must preserve existing `last_collected_task_id` unless explicit legacy attribution metadata is present.
- Legacy `vk.post_collected` / `vk.comment_collected` handlers are removed from `content-service` in this issue only. Legacy producer/fake completion removal remains #448.

## Wire contract

- Aggregate type: `vk_ingestion_batch`.
- Payload identity: `batchId`, `partId`, `partKind`, `partIndex`, `partCount`.
- Versions: `stagingSchema`, `packing`, `eventContract`; current supported contract is v1.
- Canonical part kinds: `post`, `comments`.
- Deterministic part identity namespace/algorithm must match `vk-service` `deterministic_part_id` exactly.
- `wire-digest` is treated as immutable message content identity and must match the consumed raw wire bytes according to the producer's digest algorithm.

## Receipt schema

Create `content_ingestion_receipts` with a unique deterministic event/part identity plus immutable replay-comparison fields: batch id, part kind/index/count, contract versions, wire digest and timestamps/application state required by recovery. The repository exposes a narrow get/create/mark-applied API. Insert races are resolved by the unique identity and a re-read, never by applying twice.

## Application pipeline

1. Parse raw event and headers.
2. Validate event type/version, deterministic event/part identity, batch/part metadata and digest.
3. Begin transaction and get-or-create receipt.
4. On existing identity, compare immutable fields/digest. Different content => collision/quarantine path before canonical mutation.
5. If receipt is new/unapplied, apply canonical post/comment/author effect exactly once and mark receipt applied.
6. Ensure the generic `processed_events` marker exists even on replay/recovery.
7. Enqueue deterministic ACK/commands through the transactional outbox; uniqueness makes replay idempotent.
8. Commit the database transaction.
9. Return to the Kafka consumer; only then commit the Kafka offset.

## Collision / DLQ

Malformed events and identity collisions use a typed failure/quarantine result carrying the original staged identity and required metadata. DLQ publication must preserve the canonical event metadata (`event-id`, `event-type`, `batch-id`, `wire-digest`) plus failure classification so redrive is deterministic and observable. Collision handling must not mutate canonical content.

## Consumer wiring

Introduce dedicated staged ingestion consumer/processor wiring for the canonical ingestion topic(s), separate from the legacy projection dispatcher. Reuse manual Kafka offset commits: processor success means the DB transaction has already committed; exceptions/failures that are not durably quarantined do not advance the offset.

## Legacy attribution

Staged canonical upserts must not pass a missing task id through the legacy update path because that clears `last_collected_task_id`. Use staged-specific repository operations or conditional SQL assignment. Existing attribution remains unchanged unless the staged contract explicitly carries compatible legacy task metadata.

## Tests

- strict contract/version/part identity validation;
- wire digest validation before receipt/canonical mutation;
- first application writes receipt + canonical effect + processed marker + ACK atomically;
- exact replay does not repeat canonical mutation;
- replay repairs a missing generic processed marker;
- deterministic ACK/outbox is not duplicated;
- same identity with different digest/content is rejected before mutation and reaches DLQ/quarantine;
- staged update preserves existing `last_collected_task_id`;
- transaction rollback leaves no partial receipt/effect/marker/ACK;
- processor failure prevents Kafka offset commit; successful committed processing permits it;
- redrive/recovery path is deterministic;
- legacy collected event types are no longer handled by `content-service`.

## Validation

Run content-service unit/integration tests, migration checks, repository lint/type checks, and the repository-required CI/Security/Concurrency/AI-review gates against the exact PR head. The PR base is `agent/p3-hard-cutover`.
