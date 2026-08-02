"""TaskRun freeze: immutable run snapshot, created once per run id."""

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
    """Capture execution configuration without legacy source selectors."""
    return {
        "scope": task.scope,
        "mode": task.mode,
        "postLimit": task.post_limit,
    }


def _run_meta(run: TaskRun) -> dict:
    return {
        "taskRunId": str(run.id),
        "sourceSetRevision": run.source_set_revision,
        "snapshotSha256": run.snapshot_sha256,
    }


async def freeze_task_run(
    session: AsyncSession, task: Task, sources_repo=None
) -> dict | None:
    """Freeze one concrete snapshot and return its event metadata.

    The operation is idempotent by ``execution_run_id``. Retry/resume of the
    same run returns the stored metadata and never reads live task sources or
    configuration again. Source selection comes only from normalized
    ``task_sources`` relations; legacy ``group_ids`` is intentionally excluded.
    """
    if not task.execution_run_id:
        return None
    try:
        run_id = UUID(task.execution_run_id)
    except ValueError as exc:
        raise TaskRunFreezeError(f"Invalid execution_run_id: {task.execution_run_id}") from exc

    existing = await session.get(TaskRun, run_id)
    if existing is not None:
        if existing.task_id != task.id:
            raise TaskRunFreezeError(
                f"TaskRun {run_id} belongs to task {existing.task_id}, not {task.id}"
            )
        logger.info("TaskRun snapshot reused: task_run_id=%s task_id=%s", run_id, task.id)
        return _run_meta(existing)

    if sources_repo is None:
        from app.modules.sources.repository import SourcesRepository

        sources_repo = SourcesRepository(session)
    links = await sources_repo.list_task_sources(task.id)
    sources = await sources_repo.list_sources_by_ids(link.source_id for link in links)
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
        "TaskRun created: task_run_id=%s task_id=%s source_count=%s revision=%s sha=%s...",
        run_id,
        task.id,
        len(source_set_snapshot),
        source_set_revision,
        sha[:8],
    )
    return _run_meta(run)
