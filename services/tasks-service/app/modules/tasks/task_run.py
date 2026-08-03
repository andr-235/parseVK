"""TaskRun freeze: immutable run snapshots and safe resume cloning."""

import logging
from copy import deepcopy
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Task, TaskRun, TaskRunSourceDemand
from app.modules.execution_events.metrics import count_task_run_created
from app.modules.tasks.snapshot_utils import snapshot_sha256

logger = logging.getLogger(__name__)


class TaskRunFreezeError(Exception):
    """Raised when a run snapshot cannot be frozen safely."""


def _config_snapshot(task: Task) -> dict:
    """Capture the immutable physical collection configuration."""
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
    }


def _run_id(task: Task) -> UUID:
    if not task.execution_run_id:
        raise TaskRunFreezeError(
            f"Task {task.id} has no execution_run_id"
        )
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
) -> None:
    if run.task_id != task_id:
        raise TaskRunFreezeError(
            f"TaskRun {run.id} belongs to task {run.task_id}, not {task_id}"
        )
    if not run.snapshot_sha256 or not run.source_set_snapshot:
        raise TaskRunFreezeError(
            f"TaskRun {run.id} exists without a complete frozen snapshot"
        )


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
) -> dict:
    if not source_set_snapshot:
        raise TaskRunFreezeError(
            f"Task {task.id} has no sources to persist in TaskRun {run_id}"
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
        "TaskRun created: task_run_id=%s task_id=%s source_count=%s revision=%s sha=%s...",
        run_id,
        task.id,
        len(source_set_snapshot),
        source_set_revision,
        snapshot_hash[:8],
    )
    return _run_meta(run)


async def freeze_task_run(
    session: AsyncSession,
    task: Task,
    sources_repo=None,
) -> dict:
    """Freeze one concrete run from normalized task-source relations.

    The operation is idempotent by ``execution_run_id``. Re-reading the same
    run returns its stored metadata and never consults mutable live sources.
    """
    run_id = _run_id(task)
    existing = await session.get(TaskRun, run_id)
    if existing is not None:
        _validate_existing_run(existing, task_id=task.id)
        logger.info(
            "TaskRun snapshot reused: task_run_id=%s task_id=%s",
            run_id,
            task.id,
        )
        return _run_meta(existing)

    if sources_repo is None:
        from app.modules.sources.repository import SourcesRepository

        sources_repo = SourcesRepository(session)
    links = await sources_repo.list_task_sources(task.id)
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
            "sourceRevision": source.revision,
            "taskRevision": task.revision,
        }
        for source in sources
    ]
    config_snapshot = _config_snapshot(task)
    source_set_revision = max(
        [int(task.revision or 0)]
        + [int(source.revision or 0) for source in sources]
    )
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
) -> dict:
    """Create a child TaskRun from the previous immutable snapshot.

    A terminal run is never reopened. The child receives a new TaskRun id but
    keeps the exact physical plan and snapshot hash, so retry semantics cannot
    drift when task sources or configuration change after the original start.
    Legacy tasks without a valid previous snapshot fall back to a normal freeze
    from their normalized task-source relations.
    """
    new_run_id = _run_id(task)
    existing = await session.get(TaskRun, new_run_id)
    if existing is not None:
        _validate_existing_run(existing, task_id=task.id)
        return _run_meta(existing)

    if previous_run_id:
        try:
            previous_id = UUID(previous_run_id)
        except ValueError:
            previous_id = None
        if previous_id is not None:
            previous = await session.get(TaskRun, previous_id)
            if previous is not None:
                _validate_existing_run(previous, task_id=task.id)
                return await _persist_snapshot(
                    session,
                    task,
                    run_id=new_run_id,
                    config_snapshot=dict(previous.config_snapshot or {}),
                    source_set_snapshot=list(
                        previous.source_set_snapshot or []
                    ),
                    source_set_revision=int(previous.source_set_revision),
                    snapshot_hash=str(previous.snapshot_sha256),
                    run_revision=int(previous.run_revision or 1) + 1,
                )

    logger.warning(
        "Previous TaskRun snapshot unavailable for task_id=%s previous_run_id=%s; "
        "freezing from normalized task sources",
        task.id,
        previous_run_id,
    )
    return await freeze_task_run(session, task)
