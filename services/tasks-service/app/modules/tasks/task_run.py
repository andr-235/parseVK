"""TaskRun freeze: immutable run snapshots and explicit resume lineage."""

import logging
from copy import deepcopy
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Task, TaskRun, TaskRunSourceDemand
from app.modules.execution_events.metrics import count_task_run_created
from app.modules.tasks.snapshot_utils import snapshot_sha256

logger = logging.getLogger(__name__)
TERMINAL_RUN_STATUSES = frozenset({"completed", "failed", "cancelled"})


class TaskRunFreezeError(Exception):
    """Raised when a run snapshot cannot be frozen safely."""


def _config_snapshot(task: Task) -> dict:
    return {
        "scope": task.scope,
        "mode": task.mode,
        "postLimit": task.post_limit,
        "taskRevision": task.revision,
    }


def _run_meta(run: TaskRun) -> dict:
    return {
        "taskRunId": str(run.id),
        "sourceSetRevision": run.source_set_revision,
        "snapshotSha256": run.snapshot_sha256,
        "resumedFromTaskRunId": (
            str(run.resumed_from_task_run_id)
            if run.resumed_from_task_run_id is not None
            else None
        ),
        "retryReason": run.retry_reason,
    }


def _run_id(task: Task) -> UUID:
    if not task.execution_run_id:
        raise TaskRunFreezeError(f"Task {task.id} has no execution_run_id")
    try:
        return UUID(task.execution_run_id)
    except ValueError as exc:
        raise TaskRunFreezeError(
            f"Invalid execution_run_id: {task.execution_run_id}"
        ) from exc


def _validate_existing_run(
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
    if run.resumed_from_task_run_id != expected_parent_id:
        raise TaskRunFreezeError(
            f"TaskRun {run.id} has conflicting resume lineage"
        )


async def _lock_source_set(session: AsyncSession, task: Task) -> Task:
    if not isinstance(task, Task):
        return task
    locked = await session.scalar(
        select(Task)
        .where(Task.id == task.id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    if locked is None:
        raise TaskRunFreezeError(f"Task {task.id} disappeared before freeze")
    return locked


async def _persist_snapshot(
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
    return _run_meta(run)


async def freeze_task_run(
    session: AsyncSession,
    task: Task,
    sources_repo=None,
) -> dict:
    """Freeze one root run from normalized task-source relations."""
    run_id = _run_id(task)
    existing = await session.get(TaskRun, run_id)
    if existing is not None:
        _validate_existing_run(existing, task_id=task.id)
        return _run_meta(existing)

    task = await _lock_source_set(session, task)
    if sources_repo is None:
        from app.modules.sources.repository import SourcesRepository

        sources_repo = SourcesRepository(session)
    links = await sources_repo.list_task_sources(task.id)
    kind_by_source_id = {link.source_id: link.kind for link in links}
    sources = await sources_repo.list_sources_by_ids(
        link.source_id for link in links
    )
    if not sources:
        raise TaskRunFreezeError(
            f"Task {task.id} has no normalized sources to freeze"
        )

    source_set_snapshot = [
        {
            "sourceId": str(source.id),
            "provider": source.provider,
            "sourceType": source.source_type,
            "externalId": source.external_id,
            "ownerId": source.owner_id,
            "kind": kind_by_source_id[source.id],
            "sourceRevision": source.revision,
            "taskRevision": task.revision,
        }
        for source in sources
    ]
    config_snapshot = _config_snapshot(task)
    source_set_revision = int(task.source_set_revision or 0)
    snapshot_hash = snapshot_sha256(
        {
            "config": config_snapshot,
            "sourceSet": source_set_snapshot,
            "sourceSetRevision": source_set_revision,
        }
    )
    return await _persist_snapshot(
        session,
        task,
        run_id=run_id,
        config_snapshot=config_snapshot,
        source_set_snapshot=source_set_snapshot,
        source_set_revision=source_set_revision,
        snapshot_hash=snapshot_hash,
    )


async def freeze_resumed_task_run(
    session: AsyncSession,
    task: Task,
    previous_run_id: str | None,
    *,
    retry_reason: str = "manual_resume",
) -> dict:
    """Create a child run from one complete terminal parent snapshot."""
    new_run_id = _run_id(task)
    if not previous_run_id:
        raise TaskRunFreezeError(
            f"Task {task.id} cannot resume without a previous TaskRun"
        )
    try:
        previous_id = UUID(previous_run_id)
    except ValueError as exc:
        raise TaskRunFreezeError(
            f"Task {task.id} has invalid previous TaskRun id: {previous_run_id}"
        ) from exc
    if previous_id == new_run_id:
        raise TaskRunFreezeError("Resumed TaskRun must have a new identifier")

    existing = await session.get(TaskRun, new_run_id)
    if existing is not None:
        _validate_existing_run(
            existing,
            task_id=task.id,
            expected_parent_id=previous_id,
        )
        return _run_meta(existing)

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
    _validate_existing_run(previous, task_id=task.id)
    if previous.status not in TERMINAL_RUN_STATUSES:
        raise TaskRunFreezeError(
            f"Previous TaskRun {previous_id} is not terminal: {previous.status}"
        )

    return await _persist_snapshot(
        session,
        task,
        run_id=new_run_id,
        config_snapshot=dict(previous.config_snapshot),
        source_set_snapshot=list(previous.source_set_snapshot),
        source_set_revision=int(previous.source_set_revision),
        snapshot_hash=str(previous.snapshot_sha256),
        run_revision=int(previous.run_revision) + 1,
        resumed_from_task_run_id=previous_id,
        retry_reason=retry_reason[:1000],
    )
