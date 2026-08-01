#!/usr/bin/env python3
"""Backfill normalized task sources and immutable TaskRun snapshots."""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import sys
from pathlib import Path
from typing import Any
from uuid import UUID, NAMESPACE_URL, uuid5

_SERVICE_ROOT = Path(__file__).resolve().parent.parent
if str(_SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(_SERVICE_ROOT))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import MonitoringSource, Task, TaskRun, TaskRunSourceDemand, TaskSource
from app.db.session import SessionLocal

logger = logging.getLogger("backfill_task_sources")
SourceKey = tuple[str, str, str]


def setup_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S%z",
    )


def canonical_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def snapshot_sha256(value: Any) -> str:
    from common.security import stable_sha256

    return stable_sha256(canonical_json(value))


def source_key(provider: str, source_type: str, external_id: str) -> SourceKey:
    return provider, source_type, str(int(external_id))


def stable_source_id(key: SourceKey) -> UUID:
    provider, source_type, external_id = key
    return uuid5(NAMESPACE_URL, f"parsevk:{provider}:{source_type}:{external_id}")


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
    linked = 0
    skipped = 0
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
    selected = sorted(
        (source for source in sources.values() if source.id in linked_ids),
        key=lambda source: (
            source.provider,
            source.source_type,
            source.external_id,
            str(source.id),
        ),
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
        for source in selected
    ]
    config_snapshot = {
        "scope": task.scope,
        "mode": task.mode,
        "postLimit": task.post_limit,
        "groupIds": list(task.group_ids),
    }
    payload = {
        "config": config_snapshot,
        "sourceSet": source_set_snapshot,
        "sourceSetRevision": task.revision,
    }
    sha = snapshot_sha256(payload)
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
                task_linked, task_skipped = await process_task_sources(
                    session, task, sources, existing_links, dry_run
                )
                linked += task_linked
                skipped += task_skipped
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


async def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--dry-run", action="store_true")
    group.add_argument("--commit", action="store_true")
    args = parser.parse_args()

    setup_logging()
    async with SessionLocal() as session:
        async with session.begin():
            summary = await run_backfill(session, dry_run=args.dry_run)
    logger.info("Backfill complete. Summary: %s", summary)


if __name__ == "__main__":
    asyncio.run(main())
