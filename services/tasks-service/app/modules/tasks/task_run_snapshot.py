"""Shared invariants and persistence for immutable TaskRun snapshots."""

from __future__ import annotations

import logging
from copy import deepcopy
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Task, TaskRun, TaskRunSourceDemand
from app.modules.execution_events.metrics import count_task_run_created

logger = logging.getLogger(__name__)


class TaskRunFreezeError(Exception):
    """Raised when a TaskRun snapshot cannot be frozen safely."""


def run_id_for_task(task: Task) -> UUID:
    if not task.execution_run_id:
        raise TaskRunFreezeError(f"Task {task.id} has no execution_run_id")
    try:
        return UUID(task.execution_run_id)
    except ValueError as exc:
        raise TaskRunFreezeError(
            f"Invalid execution_run_id: {task.execution_run_id}"
        ) from exc


def run_metadata(run: TaskRun) -> dict:
    metadata = {
        "taskRunId": str(run.id),
        "sourceSetRevision": run.source_set_revision,
        "snapshotSha256": run.snapshot_sha256,
    }
    parent_id = getattr(run, "resumed_from_task_run_id", None)
    if parent_id is not None:
        metadata["resumedFromTaskRunId"] = str(parent_id)
        metadata["retryReason"] = getattr(run, "retry_reason", None)
    return metadata


def validate_existing_run(
    run: TaskRun,
    *,
    task_id: int,
    expected_parent_id: UUID | None = None,
) -> None:
    if run.task_id != task_id:
        raise TaskRunFreezeError(
            f"TaskRun {run.id} belongs to task {run.task_id}, not {task_id}"
        )
    if (
        not run.snapshot_sha256
        or len(run.snapshot_sha256) != 64
        or not run.config_snapshot
        or not run.source_set_snapshot
    ):
        raise TaskRunFreezeError(
            f"TaskRun {run.id} exists without a complete frozen snapshot"
        )
    actual_parent_id = getattr(run, "resumed_from_task_run_id", None)
    if actual_parent_id != expected_parent_id:
        raise TaskRunFreezeError(
            f"TaskRun {run.id} has conflicting resume lineage"
        )


async def persist_snapshot(
    session: AsyncSession,
    task: Task,
    *,
    run_id: UUID,
    config_snapshot: dict,
    source_set_snapshot: list[dict],
    source_set_revision: int,
    snapshot_hash: str,
    run_revision: int = 1,
    resumed_from_task_run_id: UUID | None = None,
    retry_reason: str | None = None,
) -> dict:
    _validate_new_snapshot(
        task,
        run_id=run_id,
        config_snapshot=config_snapshot,
        source_set_snapshot=source_set_snapshot,
        snapshot_hash=snapshot_hash,
        resumed_from_task_run_id=resumed_from_task_run_id,
        retry_reason=retry_reason,
    )
    run = TaskRun(
        id=run_id,
        task_id=task.id,
        run_revision=run_revision,
        status="requested",
        source_set_revision=source_set_revision,
        snapshot_sha256=snapshot_hash,
        config_snapshot=deepcopy(config_snapshot),
        source_set_snapshot=deepcopy(source_set_snapshot),
        resumed_from_task_run_id=resumed_from_task_run_id,
        retry_reason=retry_reason,
    )
    session.add(run)
    for source_payload in source_set_snapshot:
        session.add(
            TaskRunSourceDemand(
                task_run_id=run_id,
                source_id=UUID(str(source_payload["sourceId"])),
                status="active",
                payload=deepcopy(source_payload),
            )
        )
    await session.flush()
    count_task_run_created()
    logger.info(
        "TaskRun created: id=%s task=%s sources=%s revision=%s parent=%s sha=%s...",
        run_id,
        task.id,
        len(source_set_snapshot),
        source_set_revision,
        resumed_from_task_run_id,
        snapshot_hash[:8],
    )
    return run_metadata(run)


def _validate_new_snapshot(
    task: Task,
    *,
    run_id: UUID,
    config_snapshot: dict,
    source_set_snapshot: list[dict],
    snapshot_hash: str,
    resumed_from_task_run_id: UUID | None,
    retry_reason: str | None,
) -> None:
    if not config_snapshot:
        raise TaskRunFreezeError(
            f"Task {task.id} has no configuration to persist in TaskRun {run_id}"
        )
    if not source_set_snapshot:
        raise TaskRunFreezeError(
            f"Task {task.id} has no sources to persist in TaskRun {run_id}"
        )
    if len(snapshot_hash) != 64:
        raise TaskRunFreezeError(f"TaskRun {run_id} has an invalid snapshot hash")
    if resumed_from_task_run_id is None and retry_reason is not None:
        raise TaskRunFreezeError("Root TaskRun cannot have a retry reason")
    if resumed_from_task_run_id is not None and not retry_reason:
        raise TaskRunFreezeError("Resumed TaskRun requires a retry reason")
