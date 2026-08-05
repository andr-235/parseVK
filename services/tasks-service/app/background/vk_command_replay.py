import logging

from sqlalchemy import String, cast, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Task, TaskRun
from app.modules.outbox.service import OutboxService
from app.modules.tasks.vk_command import (
    VK_EXECUTION_REQUESTED,
    build_vk_execution_requested,
)

logger = logging.getLogger(__name__)
CUTOVER_REPLAY_VERSION = "source-runtime-v1"
ACTIVE_TASK_STATUSES = ("pending", "running")
ACTIVE_RUN_STATUSES = ("requested", "running")


async def replay_active_vk_commands(session: AsyncSession) -> int:
    """Queue one recovery command for every active frozen TaskRun.

    A dedicated cutover dedupe key makes the replay idempotent across service
    restarts while producing a new message id distinct from the PR06A bridge.
    The canonical consumer can therefore rebuild bindings after the VK runtime
    migration even when the old message id is already present in its inbox.
    """

    rows = list(
        (
            await session.execute(
                select(Task, TaskRun)
                .join(
                    TaskRun,
                    (TaskRun.task_id == Task.id)
                    & (cast(TaskRun.id, String) == Task.execution_run_id),
                )
                .where(
                    Task.status.in_(ACTIVE_TASK_STATUSES),
                    TaskRun.status.in_(ACTIVE_RUN_STATUSES),
                    TaskRun.snapshot_sha256.is_not(None),
                )
                .order_by(Task.id, TaskRun.created_at)
            )
        ).all()
    )
    outbox = OutboxService(session)
    queued = 0
    for task, task_run in rows:
        command = await build_vk_execution_requested(
            session,
            task,
            task_run.id,
        )
        execution_id = str(command.execution_id)
        await outbox.add_event(
            event_type=VK_EXECUTION_REQUESTED,
            aggregate_type="vk_execution",
            aggregate_id=execution_id,
            correlation_id=execution_id,
            dedupe_key=(
                f"{VK_EXECUTION_REQUESTED}:{CUTOVER_REPLAY_VERSION}:"
                f"{execution_id}"
            ),
            payload=command.to_wire(),
        )
        queued += 1

    if queued:
        logger.warning(
            "Queued %d active frozen TaskRun command(s) for canonical cutover replay",
            queued,
        )
    return queued
