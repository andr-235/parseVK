"""TaskRun freeze: immutable run snapshot, created once per run start.

A run's concrete snapshot is frozen at creation/start and NEVER re-read from
live task config afterwards (issue #284 AC). Freeze failure raises before any
outbox publish — the whole transaction rolls back.
"""

import logging
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Task, TaskRun, TaskRunSourceDemand
from app.modules.execution_events.metrics import count_task_run_created
from app.modules.tasks.snapshot_utils import snapshot_sha256

logger = logging.getLogger(__name__)


class TaskRunFreezeError(Exception):
    """Raised when the run snapshot cannot be frozen."""


def _config_snapshot(task: Task) -> dict:
    return {
        "scope": task.scope,
        "mode": task.mode,
        "postLimit": task.post_limit,
        "groupIds": task.group_ids,
    }


async def freeze_task_run(
    session: AsyncSession, task: Task, sources_repo=None
) -> dict | None:
    """Freeze the concrete snapshot for a task run; returns additive payload meta.

    Returns None when the task has no execution_run_id. Requires
    ``task_sources`` rows to be populated before the call (compat adapter or
    automation clone). Raises TaskRunFreezeError on any failure.
    """
    if not task.execution_run_id:
        return None
    try:
        run_id = UUID(task.execution_run_id)
    except ValueError as exc:
        raise TaskRunFreezeError(f"Invalid execution_run_id: {task.execution_run_id}") from exc

    if sources_repo is None:
        from app.modules.sources.repository import SourcesRepository

        sources_repo = SourcesRepository(session)
    links = await sources_repo.list_task_sources(task.id)
    sources = [
        source
        for link in links
        if (source := await sources_repo.get_source_by_id(link.source_id))
    ]
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
    source_set_revision = task.revision
    sha = snapshot_sha256(
        {
            "config": config_snapshot,
            "sourceSet": source_set_snapshot,
            "sourceSetRevision": source_set_revision,
        }
    )

    run = TaskRun(
        id=run_id,
        task_id=task.id,
        run_revision=1,
        status="requested",
        source_set_revision=source_set_revision,
        snapshot_sha256=sha,
        config_snapshot=config_snapshot,
        source_set_snapshot=source_set_snapshot,
    )
    session.add(run)
    for source_payload in source_set_snapshot:
        session.add(
            TaskRunSourceDemand(
                task_run_id=run_id,
                source_id=UUID(source_payload["sourceId"]),
                status="active",
                payload=source_payload,
            )
        )
    await session.flush()
    count_task_run_created()
    logger.info(
        "TaskRun created: task_run_id=%s task_id=%s revision=%s sha=%s...",
        run_id, task.id, source_set_revision, sha[:8],
    )
    logger.debug(
        "TaskRun snapshot contents: task=%s sha=%s config=%s source_set=%s",
        task.id, sha, config_snapshot, source_set_snapshot,
    )
    return {
        "taskRunId": str(run_id),
        "sourceSetRevision": source_set_revision,
        "snapshotSha256": sha,
    }
