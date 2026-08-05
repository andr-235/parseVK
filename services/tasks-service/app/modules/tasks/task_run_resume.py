"""Create an immutable child TaskRun from one terminal parent snapshot."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Task, TaskRun
from app.modules.tasks.task_run_snapshot import (
    TaskRunFreezeError,
    persist_snapshot,
    run_id_for_task,
    run_metadata,
    validate_existing_run,
)

TERMINAL_RUN_STATUSES = frozenset({"completed", "failed", "cancelled"})


async def freeze_resumed_task_run(
    session: AsyncSession,
    task: Task,
    previous_run_id: str | None,
    *,
    retry_reason: str = "manual_resume",
) -> dict:
    """Clone one complete terminal parent; live source fallback is forbidden."""
    new_run_id = run_id_for_task(task)
    previous_id = _previous_run_id(task, previous_run_id)
    if previous_id == new_run_id:
        raise TaskRunFreezeError("Resumed TaskRun must have a new identifier")

    existing = await session.get(TaskRun, new_run_id)
    if existing is not None:
        validate_existing_run(
            existing,
            task_id=task.id,
            expected_parent_id=previous_id,
        )
        return run_metadata(existing)

    previous = await session.scalar(
        select(TaskRun)
        .where(TaskRun.id == previous_id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    if previous is None:
        raise TaskRunFreezeError(
            f"Previous TaskRun {previous_id} does not exist"
        )
    validate_existing_run(previous, task_id=task.id)
    if previous.status not in TERMINAL_RUN_STATUSES:
        raise TaskRunFreezeError(
            f"Previous TaskRun {previous_id} is not terminal: {previous.status}"
        )

    reason = retry_reason.strip()[:1000]
    if not reason:
        raise TaskRunFreezeError("Resumed TaskRun requires a retry reason")
    return await persist_snapshot(
        session,
        task,
        run_id=new_run_id,
        config_snapshot=dict(previous.config_snapshot),
        source_set_snapshot=list(previous.source_set_snapshot),
        source_set_revision=int(previous.source_set_revision),
        snapshot_hash=str(previous.snapshot_sha256),
        run_revision=int(previous.run_revision) + 1,
        resumed_from_task_run_id=previous_id,
        retry_reason=reason,
    )


def _previous_run_id(task: Task, value: str | None) -> UUID:
    if not value:
        raise TaskRunFreezeError(
            f"Task {task.id} cannot resume without a previous TaskRun"
        )
    try:
        return UUID(value)
    except ValueError as exc:
        raise TaskRunFreezeError(
            f"Task {task.id} has invalid previous TaskRun id: {value}"
        ) from exc
