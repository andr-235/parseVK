# P3 canonical moderation cutover runbook

Issue: #449  
Integration branch: `agent/p3-hard-cutover`

## Goal

Move `moderation-service` from legacy physical VK batches to content-owned canonical comment changes without duplicate moderation effects or a cross-service database dependency.

## Final event paths

```text
vk-service
  -> parsevk.content.ingestion.vk
  -> content-service
       -> parsevk.content.events / content.canonical_comments_changed@v1
       -> moderation-service

tasks-service
  -> parsevk.tasks.events / task.completed@v1
  -> moderation-service (full keyword recalculation trigger only)
```

`moderation-service` must not subscribe to `parsevk.vk.events` and must reject the legacy `vk.comments_collected` boundary after cutover.

## Preconditions

Before switching moderation traffic:

1. Deploy the generated contract package containing `content.canonical_comments_changed` and its AsyncAPI/JSON Schema artifacts.
2. Deploy `content-service` with deterministic canonical moderation manifest/outbox creation enabled.
3. Confirm `parsevk.content.events`, `parsevk.content.dlq`, `parsevk.tasks.events` and `parsevk.moderation.dlq` exist.
4. Confirm the content outbox publisher is healthy.
5. Confirm the moderation database migration adding canonical post revision state has completed.
6. Do not deploy the final legacy producer deletion from #448 yet.

## Phase 1: content producer verification

Verify metrics while new canonical events are produced:

- `content_outbox_pending_events` returns to its normal baseline;
- `content_outbox_oldest_pending_seconds` does not grow continuously;
- `content_outbox_retry_total` is stable;
- content DLQ counters do not increase unexpectedly;
- the content outbox worker remains healthy.

Sample canonical messages must have:

- event type `content.canonical_comments_changed`;
- event version `1`;
- `sourceService=content-service`;
- `aggregateId == payload.postKey`;
- positive `postRevision`;
- deterministic `chunkIndex/chunkCount`;
- no task/user ownership fields.

## Phase 2: receipt/outbox reconciliation

Run inside the `content-service` runtime:

```bash
python -m app.modules.ingestion.reconcile_canonical_moderation
```

A successful run may report existing or repaired events. Any of the following is a stop condition:

- receipt without a canonical moderation manifest when that receipt is expected to be P3-compatible;
- orphan canonical event without an authoritative receipt manifest;
- event ID mismatch;
- dedupe-key ownership conflict;
- envelope or payload mismatch.

Do not repair those conditions manually in SQL. Investigate the authoritative receipt/staged part and rerun the supported workflow.

## Phase 3: moderation projection reconciliation

Run inside `moderation-service`:

```bash
python -m app.modules.moderation.reconcile_canonical_content --limit 500
```

The command pages through the authenticated `content-service` endpoint:

```text
GET /internal/content/comments/reconciliation
```

It applies keyword matching from canonical snapshots and respects canonical `postRevision`. It does not connect to the content database.

Record the returned counters (`pages`, `scanned`, `matching`, `applied`, `stale`). A non-advancing cursor or invalid canonical row is a stop condition.

## Phase 4: switch moderation consumers

Deploy `moderation-service` with these runtime inputs:

```text
MODERATION_KAFKA_TOPIC_CONTENT=parsevk.content.events
MODERATION_KAFKA_TOPIC_TASKS=parsevk.tasks.events
```

The service starts two consumers:

- canonical content consumer for moderation projection;
- task lifecycle consumer for the existing full recalculation trigger.

There is no moderation runtime setting for the raw VK topic.

## Phase 5: verification

After the switch, verify all of the following:

1. New matching comments appear in moderation from canonical content events.
2. Duplicate canonical events do not create duplicate moderation effects.
3. Reordered older `postRevision` events cannot overwrite a newer projection.
4. `task.completed@v1` still schedules full keyword recalculation exactly once per processed event.
5. Invalid canonical source/version/payload messages follow retry/DLQ handling.
6. Moderation consumer lag remains bounded on both content and task topics.
7. `parsevk.moderation.dlq` does not grow unexpectedly.
8. No production moderation logs/config/code path references `vk.comments_collected` or subscribes to `parsevk.vk.events`.

## Rollback

Rollback is deliberately asymmetric.

If moderation consumption fails but canonical content publishing is healthy:

1. Stop/roll back the moderation deployment only.
2. Keep `content-service` canonical event production running so the Kafka log remains replayable.
3. Fix the consumer and redeploy it with the same consumer group/dedupe semantics.
4. Rerun moderation canonical reconciliation if projection parity is uncertain.

Do **not** re-enable `vk.comments_collected` as a fallback. Returning downstream consumers to physical ingress would recreate the ownership violation #449 removes.

If canonical publishing itself is corrupt:

1. Stop the content outbox publisher/ingestion path that advances the corrupted state.
2. Preserve receipt, outbox, staged-part and DLQ evidence.
3. Run the supported content reconciliation workflow after the defect is corrected.
4. Resume publishing only after identity/dedupe invariants verify cleanly.

## Gate to #447 and #448

#449 is complete only when CI, security, migration, contract, real PostgreSQL/Kafka P3 gates and AI review are green and the PR is merged into `agent/p3-hard-cutover`.

Only then proceed to #447, followed by #448. The P3 integration branch is merged to `main` only after the full sequence is complete.
