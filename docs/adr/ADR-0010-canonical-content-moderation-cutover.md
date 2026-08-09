# ADR-0010: Canonical content events are the moderation boundary

## Status

Accepted for P3 hard cutover (#449).

## Date

2026-08-09

## Context

Before P3, `moderation-service` consumed the physical VK ingestion topic and understood the legacy `vk.comments_collected` batch shape. That made moderation depend on provider transport details owned by `vk-service` and created a second downstream interpretation of raw VK data.

The ownership boundary established by ADR-0007 is stricter for the P3 hard cutover:

- `vk-service` owns provider acquisition and durable staged ingress;
- `content-service` owns canonical post/comment state;
- downstream services consume content-owned canonical events, not physical VK batches.

## Decision

Moderation consumes `content.canonical_comments_changed@v1` from `parsevk.content.events`.

```text
VK API
  -> vk-service durable staging
  -> parsevk.content.ingestion.vk
  -> content-service canonical transaction
       + canonical mutation
       + ingestion receipt / processed marker
       + deterministic ingestion ACK outbox
       + deterministic canonical moderation outbox
  -> parsevk.content.events
  -> moderation-service
       + strict source/version/payload validation
       + keyword projection
       + processed-event dedupe
```

`moderation-service` also consumes `task.completed@v1` from `parsevk.tasks.events` only to preserve the existing full keyword recalculation trigger. It does not consume `parsevk.vk.events`.

The existing realtime contract `content.comments_projected` remains unchanged and separate. It is not the moderation boundary.

## Canonical event contract

The generated contract is `content.canonical_comments_changed` version 1.

Required ownership and identity rules:

- producer: `content-service`;
- topic: `parsevk.content.events`;
- partition key: `payload.postKey`;
- `sourceService` must equal `content-service`;
- `sourceMessageId` and `batchId` are UUIDs;
- `postRevision` is positive;
- `chunkIndex` is zero-based and strictly smaller than `chunkCount`;
- payload validation rejects unknown fields.

A canonical comment contains the normalized fields moderation needs: owner ID, post ID, comment ID, optional author ID, optional text and optional canonical creation timestamp. Task/user ownership is intentionally absent from this boundary.

## Deterministic batching and replay

Canonical comment changes are sorted deterministically and split into chunks of at most 250 comments. Canonical event IDs are UUIDv5 values derived from the staged source message identity and chunk index. The receipt stores an immutable canonical moderation manifest containing event identity, dedupe key, aggregate, correlation ID, created time and payload.

Replay invariants:

1. A duplicate staged part verifies the immutable receipt and canonical event manifest and does not reapply canonical mutation.
2. Receipt present + canonical outbox event missing repairs the exact stored event.
3. Canonical event or canonical dedupe key present without an authoritative receipt is corruption and must fail closed.
4. A conflicting existing event is never silently accepted through `ON CONFLICT DO NOTHING`.
5. Reordered moderation events are guarded by canonical `postRevision`; an older revision cannot overwrite a newer projection.

## Reconciliation

Two workflows exist and have different purposes.

### Content outbox integrity

`python -m app.modules.ingestion.reconcile_canonical_moderation`

This verifies receipt manifests against canonical moderation outbox rows, reconstructs only missing exact events, and fails on orphaned/conflicting state. Receipts predating the canonical manifest are reported instead of guessed.

### Moderation projection backfill

`python -m app.modules.moderation.reconcile_canonical_content --limit 500`

The moderation command reads canonical comments through the authenticated `content-service` internal API (`/internal/content/comments/reconciliation`) and reapplies the moderation projection using canonical revisions. It never reads the content database directly.

## Runtime configuration

Moderation runtime inputs after cutover are:

- `MODERATION_KAFKA_TOPIC_CONTENT=parsevk.content.events`;
- `MODERATION_KAFKA_TOPIC_TASKS=parsevk.tasks.events`.

There is no moderation setting for `parsevk.vk.events` and no `vk.comments_collected` branch in production moderation code.

## Observability

The content outbox exposes:

- `content_outbox_pending_events`;
- `content_outbox_oldest_pending_seconds`;
- `content_outbox_retry_total{event_type=...}`;
- shared outbox publisher/DLQ metrics under the content namespace;
- worker health for the content outbox publisher.

Operationally, alert on sustained pending backlog, increasing oldest-event age, retry/DLQ growth, consumer lag and any reconciliation corruption result.

## Consequences

### Positive

- moderation no longer understands physical VK batches;
- content is the single owner of canonical moderation input;
- replay and crash recovery preserve exact event identity;
- historical moderation state can be reconciled over an API boundary;
- the final P3 raw-producer deletion in #448 no longer risks breaking moderation.

### Negative

- canonical content publishing becomes a required dependency for fresh moderation results;
- receipt/outbox corruption intentionally stops progress and requires operator investigation;
- the cutover requires coordinated deployment and reconciliation rather than an independent moderation deployment.

## Rollout

See `docs/operations/p3-canonical-moderation-cutover.md`.

## References

- #449 — Publish canonical content changes and migrate moderation
- #446 — prerequisite durable content ingestion/receipt work
- ADR-0007 — source integration vs canonical content ownership
