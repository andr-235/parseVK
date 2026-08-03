# VK execution attempts, leases and fencing

## Runtime model

`vk_executions` stores the logical VK workflow and its immutable plan. A worker crash does not create a new logical workflow and does not reopen a terminal workflow.

`vk_execution_attempts` stores physical worker attempts. Every claim creates a new attempt with:

- a monotonically increasing `attempt_number`;
- a monotonically increasing `fencing_token`;
- a worker identifier;
- provider account and credential version snapshots;
- lease expiry and heartbeat timestamps.

Only the attempt referenced by `vk_executions.current_attempt_id` with the matching fencing token may heartbeat, commit a checkpoint, release work or record a terminal result. `worker_id` is diagnostic metadata and is never used as proof of ownership.

## Recovery

When the current attempt lease expires, the next claim transaction:

1. locks the logical execution;
2. marks the old attempt `expired`;
3. creates the next attempt and fencing token;
4. keeps the same logical execution and checkpoint history.

Ingestion resumes from the last committed `vk_ingestion_checkpoints` position. A stale attempt may finish an in-flight VK request, but fencing is checked again before the page transaction commits, so it cannot advance the checkpoint or publish terminal effects.

Non-transactional checks before and after VK requests use short read-only transactions. `SELECT ... FOR UPDATE` is reserved for the page or final database transaction immediately before commit, so heartbeat and cancellation are not blocked by network work.

## Cancellation and shutdown

`task.cancelled` and `task.deleted` persist `cancellation_requested_at` and a reason. Repeated cancellation is idempotent.

The active attempt checks cancellation:

- before and after VK requests;
- before every request made by an asynchronous page iterator;
- inside the same database transaction before a page or final result commits.

A pending execution is cancelled immediately. A running execution stops cooperatively and records one terminal cancellation.

During service shutdown, the worker stops claiming new executions and waits up to `VK_SERVICE_TASK_SHUTDOWN_GRACE_SECONDS`. Remaining attempts are cancelled locally and released for immediate recovery. Shutdown is not recorded as a user cancellation or terminal failure.

## Configuration

- `VK_SERVICE_TASK_HEARTBEAT_SECONDS`: heartbeat interval.
- `VK_SERVICE_TASK_LEASE_SECONDS`: lease duration. It must be at least three heartbeat intervals.
- `VK_SERVICE_TASK_SHUTDOWN_GRACE_SECONDS`: time allowed for active attempts to reach a safe point during shutdown.
- `VK_SERVICE_TASK_MAX_ATTEMPTS`: maximum physical attempts before terminal failure.

Default values are 20 seconds, 90 seconds, 20 seconds and 3 attempts respectively.

## Metrics and alerts

Available metrics:

- `vk_execution_attempt_started_total`;
- `vk_execution_attempt_recovered_total`;
- `vk_execution_attempt_released_total`;
- `vk_execution_lease_expired_total`;
- `vk_execution_fence_rejected_total{operation}`;
- `vk_execution_cancellation_requested_total`;
- `vk_execution_terminal_total{outcome}`;
- `vk_execution_active_attempts`.

A recovery and lease-expiry observation is recorded only when the immediately previous physical attempt was persisted as `expired`. Graceful shutdown and provider-driven releases are counted as releases, not lease expiries. The active-attempt gauge follows executor lifetime and is decremented on every exit path, including stale-fence rejection.

Recommended alerts:

- any sustained increase in fencing rejections;
- repeated lease expiries for the same deployment;
- recovery rate increasing while provider requests remain healthy;
- active attempts remaining non-zero while worker health is unhealthy;
- pending executions growing without terminal outcomes.

A single fence rejection can be expected during crash recovery. Repeated rejections indicate an unhealthy worker, database latency or an attempt continuing past cancellation.

## Migration and rollback

Migration `pr5_vk_execution_attempts` performs a hard runtime cutover:

- existing `vk_task_runs` rows are copied to `vk_executions`;
- legacy `running` rows become `pending` so they are safely claimed under the new fencing model;
- `vk_task_runs` is dropped;
- the old task queue, lease store, executor, runner and finalizer code is removed.

There is no parallel legacy execution path.

Before deployment, take a database backup. The migration downgrade can reconstruct `vk_task_runs`, but it is an emergency rollback only. Downgrade is safe only before new executions and attempts become authoritative in production. After the observation window begins, rollback should restore the pre-deployment database backup together with the previous application image rather than attempting to merge two runtime histories.

## Terminal semantics

Terminal states are `done`, `failed` and `cancelled`.

A terminal execution is immutable and cannot be reclaimed or resumed. A later TaskRun creates a new execution. When it follows a terminal execution for the same task, `parent_execution_id` records the relationship without mutating the previous execution.
