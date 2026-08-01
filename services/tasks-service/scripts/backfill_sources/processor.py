import logging
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import MonitoringSource, Task, TaskRun, TaskRunSourceDemand, TaskSource
from scripts.backfill_sources.identity import SourceKey, source_key, stable_source_id
from scripts.backfill_sources.snapshots import build_run_snapshot, build_source_set_snapshot

logger = logging.getLogger("backfill_task_sources")


async def fetch_tasks(session: AsyncSession) -> list[Task]:
    return list(await session.scalars(select(Task).order_by(Task.id.asc())))


async def fetch_existing_links(session: AsyncSession) -> set[tuple[int, UUID]]:
    result = await session.scalars(select(TaskSource))
    return {(link.task_id, link.source_id) for link in result}


async def fetch_sources(session: AsyncSession) -> dict[SourceKey, MonitoringSource]:
    result = await session.scalars(select(MonitoringSource))
    return {
        source_key(source.provider, source.source_type, source.external_id): source
        for source in result
    }


async def process_task_sources(
    session: AsyncSession,
    task: Task,
    sources: dict[SourceKey, MonitoringSource],
    existing_links: set[tuple[int, UUID]],
    dry_run: bool,
) -> tuple[int, int]:
    linked = skipped = 0
    for group_id in task.group_ids:
        key = source_key("vk", "community", str(group_id))
        source = sources.get(key)
        if source is None:
            source = MonitoringSource(
                id=stable_source_id(key),
                owner_user_id=task.owner_user_id,
                provider=key[0],
                source_type=key[1],
                external_id=key[2],
                owner_id=-int(key[2]),
            )
            if not dry_run:
                session.add(source)
                await session.flush()
            sources[key] = source
        pair = (task.id, source.id)
        if pair in existing_links:
            skipped += 1
            continue
        existing_links.add(pair)
        if not dry_run:
            session.add(TaskSource(task_id=task.id, source_id=source.id, kind="target"))
        linked += 1
    return linked, skipped


async def process_task_run_baseline(
    session: AsyncSession,
    task: Task,
    sources: dict[SourceKey, MonitoringSource],
    existing_links: set[tuple[int, UUID]],
    dry_run: bool,
) -> int:
    if not task.execution_run_id:
        return 0
    try:
        run_id = UUID(task.execution_run_id)
    except ValueError as exc:
        raise ValueError(
            f"task {task.id} has invalid execution_run_id={task.execution_run_id!r}"
        ) from exc

    existing = await session.get(TaskRun, run_id)
    if existing is not None:
        if existing.task_id != task.id:
            raise ValueError(
                f"task run {run_id} belongs to task {existing.task_id}, expected {task.id}"
            )
        return 0

    linked_ids = {source_id for task_id, source_id in existing_links if task_id == task.id}
    selected = [source for source in sources.values() if source.id in linked_ids]
    source_set_snapshot = build_source_set_snapshot(task, selected)
    config_snapshot, sha = build_run_snapshot(task, source_set_snapshot)
    if dry_run:
        return 1

    session.add(
        TaskRun(
            id=run_id,
            task_id=task.id,
            run_revision=1,
            status="requested",
            source_set_revision=task.revision,
            snapshot_sha256=sha,
            config_snapshot=config_snapshot,
            source_set_snapshot=source_set_snapshot,
        )
    )
    for source in source_set_snapshot:
        session.add(
            TaskRunSourceDemand(
                task_run_id=run_id,
                source_id=UUID(source["sourceId"]),
                status="active",
                payload=source,
            )
        )
    await session.flush()
    return 1


async def run_backfill(session: AsyncSession, dry_run: bool = False) -> dict[str, Any]:
    tasks = await fetch_tasks(session)
    sources = await fetch_sources(session)
    existing_links = await fetch_existing_links(session)
    linked = skipped = runs_created = 0
    errors: list[str] = []

    for task in tasks:
        try:
            async with session.begin_nested():
                added, ignored = await process_task_sources(
                    session, task, sources, existing_links, dry_run
                )
                linked += added
                skipped += ignored
            async with session.begin_nested():
                runs_created += await process_task_run_baseline(
                    session, task, sources, existing_links, dry_run
                )
        except ValueError as exc:
            errors.append(str(exc))
            logger.error("Backfill rejected task %s: %s", task.id, exc)

    summary = {
        "tasks_processed": len(tasks),
        "linked": linked,
        "skipped": skipped,
        "runs_created": runs_created,
        "errors": errors,
    }
    if errors:
        raise RuntimeError(f"Backfill completed with {len(errors)} invalid task(s): {errors}")
    return summary
