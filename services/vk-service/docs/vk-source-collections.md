# VK source collection coalescing

## Purpose

`vk-service` separates user demand from physical collection work:

- `vk_collection_demands` contains one lifecycle record for every TaskRun;
- `vk_source_collections` contains one physical VK collection aggregate;
- `vk_executions` and `vk_execution_attempts` continue to provide lease,
  heartbeat, crash recovery and fencing for that physical collection;
- canonical VK content and checkpoints are written once per physical execution.

Multiple TaskRuns may share work only when their collection identities match
exactly. There is no fuzzy or subset coalescing.

## Collection identity

The identity consists of:

1. provider account key;
2. normalized source key;
3. SHA-256 fingerprint of the immutable collection plan.

The normalized plan includes:

- provider account key;
- source key;
- scope and collection mode;
- sorted, deduplicated VK group ids;
- post limit;
- normalized collection filters.

TaskRun identity, owner, timestamps, request ids and correlation ids are excluded.
Changing the account, source, group set, mode, limit or filters produces a new
fingerprint and therefore a separate physical collection.

## Transactional attach protocol

Demand attachment runs in one database transaction:

1. acquire a PostgreSQL advisory lock for `task_id`;
2. acquire an advisory lock for the exact collection identity;
3. reject duplicate `(task_id, run_id)` and a second active demand for the task;
4. lock the matching physical execution and collection;
5. attach to a pending/running exact match or create a new execution and collection;
6. insert the demand;
7. when joining a running collection, emit `task.execution_started` for the
   current attempt in the same transaction.

The advisory locks serialize the decision. Partial unique indexes remain the
last database-level guard:

- one active collection per `(provider_account_key, source_key, fingerprint)`;
- one active demand per task;
- one demand per `(task_id, run_id)`.

## Lifecycle fan-out

VK API calls, checkpoint writes and canonical ingestion happen once. TaskRun
lifecycle remains independent:

- claim emits `task.execution_started` for every active demand;
- a late demand joining a running collection receives its own started event;
- progress updates increment each demand's own execution sequence;
- completion and failure are persisted as one durable outbox event per demand;
- terminal outbox events are written only after the current attempt passes the
  fencing check inside the terminal database transaction;
- shared collection failure records the same physical error against every
  remaining active demand.

Synchronous completion or failure HTTP callbacks are intentionally not sent by
the collection runtime. An external callback before the final fence check could
let a stale worker change TaskRun state after a replacement attempt had already
claimed the execution. `tasks-service` consumes the durable terminal events and
remains the lifecycle authority.

A shared collection with zero active demands has zero fan-out. It never falls
back to the original TaskRun identity.

## Cancellation

Cancellation is demand-scoped:

- cancelling one demand marks only that demand terminal;
- the physical collection and other demands continue;
- cancelling the final active demand sets durable cancellation on the physical
  execution;
- a pending collection becomes cancelled immediately;
- a running attempt observes cancellation through the existing safe-point and
  fencing controls.

All lifecycle writers use the lock order:

1. execution;
2. collection;
3. demand.

This order must not be changed independently in one repository path because it
prevents cancellation/terminal-write deadlocks.

## Crash recovery and fencing

The physical collection owns exactly one logical `VkExecution`. Worker crashes
do not create another collection:

1. the expired attempt is marked `expired`;
2. the next worker receives a higher fencing token;
3. the execution and collection ids remain unchanged;
4. ingestion resumes from committed execution checkpoints;
5. the stale attempt cannot heartbeat, commit a page or record terminal effects;
6. successful recovery fans out one terminal outcome to every active demand.

The PostgreSQL M2 test covers concurrent attachment, checkpoint persistence,
lease expiry, higher-fence recovery, stale terminal rejection and per-demand
completion.

## Metrics

### `vk_collection_demands_total{result}`

Values:

- `new_collection` — the demand created physical work;
- `coalesced` — the demand joined existing physical work.

The coalescing ratio can be calculated as:

```promql
sum(rate(vk_collection_demands_total{result="coalesced"}[15m]))
/
sum(rate(vk_collection_demands_total[15m]))
```

### `vk_collection_fanout_events_total{event_type}`

The collection runtime currently records `progress` fan-out. Terminal fan-out is
counted by the existing execution terminal metrics because it is persisted in
the fenced execution transaction rather than delivered through a separate
callback path.

Labels deliberately exclude TaskRun ids, collection ids and fingerprints to
avoid unbounded Prometheus cardinality.

## Recommended alerts

Investigate when any of the following persists:

- demand creation continues but both `new_collection` and `coalesced` rates drop
  to zero, indicating consumer or transaction failure;
- exact duplicate workload is expected but the coalescing ratio remains near
  zero, indicating fingerprint divergence;
- progress fan-out stops while active collections continue processing;
- terminal execution metrics increase but tasks-service does not consume the
  corresponding durable lifecycle events;
- PostgreSQL reports unique-index violations or advisory-lock wait growth;
- expired execution attempts increase together with long-running active
  collections.

Metrics are signals, not proof. Confirm the affected rows and attempt history
before changing status manually, because databases resent improvisational
medicine.

## Migration

Revision `pr6_source_collection_demands`:

1. creates both tables and indexes;
2. creates one legacy collection per existing `vk_executions` row;
3. creates one demand carrying the original TaskRun lifecycle;
4. keeps existing execution and attempt ids, checkpoints and fencing tokens;
5. enables coalescing only for newly received demands.

Legacy rows use deliberately unique source keys and fingerprints, so unrelated
in-flight executions cannot be merged during deployment.

## Deployment checks

Before rollout:

1. take a PostgreSQL backup;
2. verify no unresolved Alembic branches;
3. run the clean PostgreSQL migration matrix;
4. confirm `vk-service` workers are on the PR06-compatible image before new
   demands are accepted;
5. verify the new tables, partial indexes and metrics exist;
6. submit two exact-compatible test TaskRuns and confirm one collection, two
   demands and independent lifecycle events.

After rollout, inspect:

```sql
SELECT status, count(*)
FROM vk_source_collections
GROUP BY status;

SELECT status, count(*)
FROM vk_collection_demands
GROUP BY status;

SELECT provider_account_key, source_key, fingerprint, count(*)
FROM vk_source_collections
WHERE status IN ('pending', 'running')
GROUP BY provider_account_key, source_key, fingerprint
HAVING count(*) > 1;
```

The last query must return no rows.

## Rollback

Before new coalesced demands become authoritative, application rollback may use
Alembic downgrade after stopping all `vk-service` writers.

After a physical collection has served more than one demand, downgrade cannot
faithfully represent the many-demands-to-one-collection relationship in the old
schema. The supported rollback is therefore:

1. stop task-event consumers and collection workers;
2. preserve logs and database evidence;
3. restore the pre-deployment PostgreSQL backup;
4. deploy the previous application image;
5. replay only events known not to be represented in the restored backup.

Do not delete one demand to "unmerge" a shared collection. The canonical
content and checkpoints belong to the physical execution, not to whichever
TaskRun happened to arrive first.
