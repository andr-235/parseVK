"""Build and persist the canonical VK execution command for one TaskRun."""

from __future__ import annotations

from uuid import NAMESPACE_URL, UUID, uuid5

from parsevk_contracts.vk.commands import (
    CommentSelection,
    PostSelection,
    SourceReference,
    VkExecutionRequested,
    VkSourceDemandRequest,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.models import Task, TaskRun, TaskRunSourceDemand
from app.modules.outbox.service import OutboxService

VK_EXECUTION_REQUESTED = "vk.execution.requested"
VK_EXECUTION_REQUESTED_VERSION = 2


def execution_id_for_run(task_run_id: UUID) -> UUID:
    """Return a stable command execution id for one immutable TaskRun."""
    return uuid5(NAMESPACE_URL, f"parsevk:vk-execution:{task_run_id}")


async def build_vk_execution_requested(
    session: AsyncSession,
    task: Task,
    task_run_id: UUID,
) -> VkExecutionRequested:
    run = await session.get(TaskRun, task_run_id)
    if run is None or run.task_id != task.id:
        raise RuntimeError(
            f"TaskRun {task_run_id} does not belong to task {task.id}"
        )
    if not run.snapshot_sha256:
        raise RuntimeError(f"TaskRun {task_run_id} has no frozen snapshot hash")

    demand_models = list(
        await session.scalars(
            select(TaskRunSourceDemand)
            .where(TaskRunSourceDemand.task_run_id == task_run_id)
            .order_by(
                TaskRunSourceDemand.created_at.asc(),
                TaskRunSourceDemand.id.asc(),
            )
        )
    )
    if not demand_models:
        raise RuntimeError(f"TaskRun {task_run_id} has no source demands")

    demands: list[VkSourceDemandRequest] = []
    for demand in demand_models:
        source = dict(demand.payload or {})
        demands.append(
            VkSourceDemandRequest(
                demand_id=demand.id,
                source=SourceReference(
                    source_id=demand.source_id,
                    provider=source.get("provider"),
                    source_type=source.get("sourceType"),
                    external_id=str(source.get("externalId") or ""),
                    owner_id=int(source.get("ownerId") or 0),
                ),
            )
        )

    post_limit = int(run.config_snapshot.get("postLimit") or 0)
    if post_limit < 1:
        raise RuntimeError(f"TaskRun {task_run_id} has invalid post limit")
    task_revision = int(run.config_snapshot.get("taskRevision") or 0)
    if task_revision < 0:
        raise RuntimeError(f"TaskRun {task_run_id} has invalid task revision")

    execution_id = execution_id_for_run(task_run_id)
    return VkExecutionRequested(
        task_id=task.id,
        task_run_id=task_run_id,
        execution_id=execution_id,
        owner_user_id=task.owner_user_id,
        demands=tuple(demands),
        post_selection=PostSelection(
            strategy="latestByPublishedAt",
            limit_per_source=post_limit,
        ),
        comment_selection=CommentSelection(
            mode="all",
            include_thread_replies=True,
        ),
        task_revision=task_revision,
        source_set_revision=int(run.source_set_revision),
        snapshot_sha256=run.snapshot_sha256,
    )


async def add_vk_execution_command(
    session: AsyncSession,
    outbox: OutboxService,
    task: Task,
    run_meta: dict | None,
) -> VkExecutionRequested | None:
    """Append the canonical command in the active task transaction."""
    if not settings.vk_commands_publish_enabled:
        return None
    if not run_meta or not run_meta.get("taskRunId"):
        raise RuntimeError(
            f"Task {task.id} cannot publish VK command without a TaskRun"
        )

    task_run_id = UUID(str(run_meta["taskRunId"]))
    command = await build_vk_execution_requested(session, task, task_run_id)
    execution_id = str(command.execution_id)
    await outbox.add_event(
        event_type=VK_EXECUTION_REQUESTED,
        event_version=VK_EXECUTION_REQUESTED_VERSION,
        aggregate_type="vk_execution",
        aggregate_id=execution_id,
        correlation_id=execution_id,
        dedupe_key=f"{VK_EXECUTION_REQUESTED}:{execution_id}",
        payload=command.to_wire(),
    )
    return command
