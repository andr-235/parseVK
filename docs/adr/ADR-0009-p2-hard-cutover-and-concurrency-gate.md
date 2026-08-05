# ADR-0009: P2 hard cutover and PostgreSQL concurrency gate

- Status: Accepted
- Date: 2026-08-05
- Decision owners: parseVK maintainers
- Related: #281, #286, #421

## Context

P2 replaced the task-shaped VK execution runtime with a canonical source-level model:

```text
TaskRun
  -> VkTaskRunBinding
  -> VkCollectionDemand
  -> shared VkSourceCollection
  -> fenced VkExecutionAttempt
```

The original planning language described an additive dual-runtime rollout with shadow comparison and an observation window. During implementation that model was rejected. Keeping both runtimes would have required duplicate ownership rules, duplicate cancellation semantics, two checkpoint models and reconciliation between terminal effects. The legacy path was therefore removed instead of preserved behind a compatibility switch.

This is a reviewed exception to the default additive rollout rule in ADR-0002 and epic #281.

## Decision

P2 is a hard cutover.

- There is one canonical VK command path and one source-level physical runtime.
- Legacy task-shaped execution APIs, fields, topics and fallback branches are not retained.
- TaskRun lineage is stored on immutable TaskRuns, not on shared physical executions.
- Source identity and collection options are authoritative in `VkSourceCollection` and its normalized plan/fingerprint.
- Request and cancellation commands share one aggregate ordering key.
- PostgreSQL locking, advisory locks, leases and fencing tokens are release invariants, not implementation details.

A dedicated `P0–P2 Concurrency Gate` must repeatedly prove the following against PostgreSQL:

1. compatible concurrent attachments coalesce into one physical collection;
2. cancellation racing with another attachment cannot lose either intent;
3. progress and terminal updates for different physical executions of one TaskRun serialize without duplicate terminal effects;
4. stale attempts cannot heartbeat, commit checkpoints or record terminal state;
5. cancellation cannot overtake its earlier request in the tasks outbox;
6. a late join to running work receives started lifecycle state;
7. each TaskRun receives at most one terminal effect.

The gate also runs the complete Python service and migration matrices. Changed-service-only validation is insufficient for the P3 merge boundary.

## Rollback

Application rollback alone is not guaranteed after a destructive P2 migration.

The supported production rollback procedure is:

1. stop command consumers and execution workers;
2. restore the database from the pre-migration backup or execute the documented repair migration when lossless repair is explicitly available;
3. deploy the previous release images;
4. verify Kafka command offsets and outbox rows before resuming consumers;
5. replay only commands whose aggregate ordering and idempotency keys are still provable.

Downgrade migrations may recreate emergency placeholder columns for schema operability. They do not reconstruct discarded legacy semantics. A downgrade that invents historical task-level meaning is forbidden.

## Consequences

### Positive

- one ownership model for cancellation, progress and terminal attribution;
- no permanent compatibility package or dual-write reconciliation;
- race behaviour is executable and repeatedly checked on the same database engine used in production;
- P3 can build durable ingestion on explicit invariants.

### Negative

- rollback requires operational coordination and may require database restore;
- the concurrency gate is slower than ordinary changed-service CI;
- destructive migrations require backup evidence before deployment.

## Exit criteria

P2 hardening is complete only when:

- the dedicated PostgreSQL gate passes repeatedly;
- all Python service and migration matrices pass;
- #286 and #421 match this decision;
- no legacy runtime field or fallback remains authoritative.
