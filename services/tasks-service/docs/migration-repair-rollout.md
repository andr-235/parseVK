# Migration repair & rollout: sources + TaskRun snapshots

This document describes the rollout sequence for the P1 sources/task-run
migration in `tasks-service`, the verification steps, and the rollback order.

## Context

- New tables: `monitoring_sources`, `task_sources`, `access_scopes`,
  `scope_source_access` (migration `20260801_0001_add_source_scope_tables`).
- New tables: `task_runs`, `task_run_source_demands`
  (migration `20260801_0002_add_task_run_tables`).
- Both migrations are additive and reversible. Legacy `group_ids` column and
  the legacy task APIs remain available until cutover (a later phase).

## Rollout matrix

| Step | Command | Expected result | Guard |
|------|---------|-----------------|-------|
| 1. Dry-run backfill | `uv run python scripts/backfill_task_sources.py --dry-run` | Logs planned links and TaskRun baselines; no DB writes | Must be zero `errors`; review `[DRY-RUN]` lines |
| 2. Verify dry-run output | inspect summary dict | `linked`/`runs_created` match expectations | No unexpected duplicates in `already linked` count |
| 3. Commit backfill | `uv run python scripts/backfill_task_sources.py --commit` | Rows written; summary returned | Run inside maintenance window |
| 4. Verify after commit | rerun `--dry-run` | `linked == 0`, `runs_created == 0` (all skipped) | Idempotency check: rerun produces no duplicates |
| 5. Apply migrations to next environment | `uv run alembic upgrade head` | Both migrations applied; `alembic heads` shows `20260801_0002_add_task_run_tables (head)` | Migrations must be applied BEFORE backfill on any environment |

## Backfill semantics

- `Task.group_ids[]` -> `TaskSource` rows (provider `vk`, source_type
  `community`, `external_id = str(group_id)`, `owner_id = -group_id`).
- Pairs already linked (`task_id`, `source_id`) are skipped — rerun is
  idempotent.
- Tasks with `scope == 'all'` have empty `group_ids` by design — they receive
  an empty source set; no special rows are created.
- Baseline `TaskRun` snapshots are created only for tasks that already have
  `execution_run_id`; one baseline per task. `TaskRun.id` equals the task's
  `execution_run_id` (UUID), matching the `task_run_id` contract field.
- `snapshot_sha256` is computed over canonical JSON (sorted keys, compact
  separators) via `stable_sha256`.

## Rollback

Rollback = downgrade in reverse order of application:

1. `uv run alembic downgrade 20260801_0001_add_source_scope_tables`
   — drops `task_run_source_demands` and `task_runs`.
2. `uv run alembic downgrade pr2c1_progress_event_fields`
   — drops `scope_source_access`, `access_scopes`, `task_sources`,
   `monitoring_sources`.

Note: rollback drops the normalized rows; `group_ids` on `tasks` is untouched
and remains the source of truth until cutover, so no legacy data is lost.

## Guards

- Run backfill only after both migrations are applied.
- Do not enable `TASKS_SOURCES_API_ENABLED`/`TASKS_SOURCE_COMPAT_WRITE_ENABLED`
  in production before the backfill dry-run/commit sequence passes on staging.
- New sources/task-run code paths are behind feature flags and default to off.
