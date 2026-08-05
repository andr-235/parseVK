"""Recover active VK TaskRuns after the source-level runtime cutover."""

import logging
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Task, TaskAuditLog, TaskRun
from app.modules.outbox.service import OutboxService
from app.modules.tasks.event_payloads import task_state_changed_payload
from app.modules.tasks.vk_command import (
    VK_EXECUTION_REQUESTED,
    build_vk_execution_requested,
)

logger = logging.getLogger(__name__)

CUTOVER_REPLAY_KEY = "canonical-source-cutover-v1"
ACTIVE_TASK_STATUSES = ("pending", "running")
ACTIVE_RUN_STATUSES = ("requested", "running")
REPLAY_FAILURE = "canonical VK cutover cannot replay an incomplete frozen TaskRun"


async def replay_active_vk_commands(session: AsyncSession) -> int:
    """Queue one idempotent recovery command for each active frozen TaskRun."""
    tasks = list(
        await session.scalars(
            select(Task)
            .where(Task.status.in_(ACTIVE_TASK_STATUSES))
            .order_by(Task.id)
            .with_for_update(skip_locked=True)
        )
    )
    outbox = OutboxService(session)
    replayed = 0
    failed = 0

    for task in tasks:
        task_run = await _active_frozen_run(session, task)
        if task_run is None:
            await _fail_unreplayable(outbox, task, None, REPLAY_FAILURE)
            failed += 1
            continue

        try:
            command = await build_vk_execution_requested(session, task, task_run.id)
        except (RuntimeError, ValueError) as exc:
            await _fail_unreplayable(
                outbox,
                task,
                task_run,
                f"{REPLAY_FAILURE}: {exc}",
            )
            failed += 1
            continue

        execution_id = str(command.execution_id)
        await outbox.add_event(
            event_type=VK_EXECUTION_REQUESTED,
            aggregate_type="vk_execution",
            aggregate_id=execution_id,
            correlation_id=execution_id,
            dedupe_key=(
                f"{VK_EXECUTION_REQUESTED}:{CUTOVER_REPLAY_KEY}:{execution_id}"
            ),
            payload=command.to_wire(),
        )
        replayed += 1

    if replayed or failed:
        logger.warning(
            "Canonical cutover recovery processed active tasks: replayed=%d failed=%d",
            replayed,
            failed,
        )
    return replayed


async def _active_frozen_run(
    session: AsyncSession,
    task: Task,
) -> TaskRun | None:
    if not task.execution_run_id:
        return None
    try:
        run_id = UUID(task.execution_run_id)
    except ValueError:
        return None

    task_run = await session.get(TaskRun, run_id)
    if (
        task_run is None
        or task_run.task_id != task.id
        or task_run.status not in ACTIVE_RUN_STATUSES
        or not task_run.snapshot_sha256
        or not task_run.source_set_snapshot
    ):
        return None
    return task_run


async def _fail_unreplayable(
    outbox: OutboxService,
    task: Task,
    task_run: TaskRun | None,
    reason: str,
) -> None:
    safe_reason = reason[:2000]
    task.status = "failed"
    task.error = safe_reason
    task.revision += 1
    task.updated_at = datetime.now(UTC)
    if task_run is not None and task_run.status in ACTIVE_RUN_STATUSES:
        task_run.status = "failed"

    outbox.session.add(
        TaskAuditLog(
            owner_user_id=task.owner_user_id,
            aggregate_type="task",
            aggregate_id=str(task.id),
            task_id=task.id,
            event_type="task.cutover_replay_failed",
            event_data={
                "taskId": str(task.id),
                "runId": task.execution_run_id,
                "reason": safe_reason,
            },
        )
    )
    await outbox.add_event(
        event_type="task.state_changed",
        aggregate_type="task",
        aggregate_id=str(task.id),
        dedupe_key=(
            f"task.state_changed:{task.id}:cutover-replay-failed:{task.revision}"
        ),
        payload=task_state_changed_payload(task),
    )
