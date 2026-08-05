"""Create one root TaskRun from the current normalized source set."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Task, TaskRun
from app.modules.tasks.snapshot_utils import snapshot_sha256
from app.modules.tasks.task_run_snapshot import (
    TaskRunFreezeError,
    persist_snapshot,
    run_id_for_task,
    run_metadata,
    validate_existing_run,
)


def _config_snapshot(task: Task) -> dict:
    return {
        "scope": task.scope,
        "mode": task.mode,
        "postLimit": task.post_limit,
        "taskRevision": task.revision,
    }


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


async def freeze_task_run(
    session: AsyncSession,
    task: Task,
    sources_repo=None,
) -> dict:
    """Freeze one root run under the source-set mutation lock."""
    run_id = run_id_for_task(task)
    existing = await session.get(TaskRun, run_id)
    if existing is not None:
        validate_existing_run(existing, task_id=task.id)
        return run_metadata(existing)

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
    return await persist_snapshot(
        session,
        task,
        run_id=run_id,
        config_snapshot=config_snapshot,
        source_set_snapshot=source_set_snapshot,
        source_set_revision=source_set_revision,
        snapshot_hash=snapshot_hash,
    )
