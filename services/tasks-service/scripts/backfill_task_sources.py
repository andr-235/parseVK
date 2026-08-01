#!/usr/bin/env python3
"""Backfill TaskSource rows and baseline TaskRun snapshots from legacy data.

Semantics (issue #284 AC):
- migrate Task.group_ids[] -> TaskSource rows, skipping already-linked pairs
  (rerun is idempotent, no duplicates);
- create a baseline TaskRun snapshot for tasks that already have
  execution_run_id (config + source set + revisions + sha256);
- tasks with scope == 'all' have empty group_ids by design — they get an
  empty source set in the snapshot, no special rows are created.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import sys
from pathlib import Path
from typing import Any
from uuid import UUID, uuid4

_SERVICE_ROOT = Path(__file__).resolve().parent.parent
if str(_SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(_SERVICE_ROOT))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import MonitoringSource, Task, TaskRun, TaskRunSourceDemand, TaskSource
from app.db.session import SessionLocal

logger = logging.getLogger("backfill_task_sources")


def setup_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S%z",
    )


def canonical_json(value: Any) -> str:
    """Deterministic JSON: sorted keys, compact separators."""
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def snapshot_sha256(value: Any) -> str:
    from common.security import stable_sha256

    return stable_sha256(canonical_json(value))


async def fetch_tasks_with_group_ids(session: AsyncSession) -> list[Task]:
    result = await session.scalars(select(Task).order_by(Task.id.asc()))
    return list(result)


async def fetch_existing_links(session: AsyncSession) -> set[tuple[int, str]]:
    result = await session.scalars(select(TaskSource))
    return {(link.task_id, str(link.source_id)) for link in result}


async def fetch_sources(session: AsyncSession) -> dict[str, MonitoringSource]:
    result = await session.scalars(select(MonitoringSource))
    return {source.external_id: source for source in result}


async def process_task_sources(
    session: AsyncSession,
    task: Task,
    sources: dict[str, MonitoringSource],
    existing_links: set[tuple[int, str]],
    dry_run: bool,
) -> tuple[int, int]:
    """Mirror group_ids into TaskSource rows; returns (linked, skipped)."""
    linked = 0
    skipped = 0
    for group_id in task.group_ids:
        external_id = str(group_id)
        source = sources.get(external_id)
        if source is None:
            source = MonitoringSource(
                owner_user_id=task.owner_user_id,
                provider="vk",
                source_type="community",
                external_id=external_id,
                owner_id=-group_id,
            )
            if dry_run:
                # Simulate the flush-assigned id so the report matches commit
                # semantics (distinct sources never collide in the link set).
                source.id = uuid4()
            else:
                session.add(source)
                await session.flush()
            sources[external_id] = source
        if (task.id, str(source.id)) in existing_links:
            skipped += 1
            continue
        existing_links.add((task.id, str(source.id)))
        if not dry_run:
            session.add(TaskSource(task_id=task.id, source_id=source.id, kind="target"))
        linked += 1
        logger.info(
            "backfill source: task=%s external=%s%s",
            task.id, external_id, " [DRY-RUN]" if dry_run else "",
        )
    return linked, skipped


async def process_task_run_baseline(
    session: AsyncSession,
    task: Task,
    sources: dict[str, MonitoringSource],
    existing_links: set[tuple[int, str]],
    dry_run: bool,
) -> int:
    """Create one baseline TaskRun for tasks with execution_run_id; 0 if skipped."""
    if not task.execution_run_id:
        return 0
    existing = await session.scalar(
        select(TaskRun).where(TaskRun.task_id == task.id)
    )
    if existing is not None:
        logger.info("backfill skip (baseline exists): task=%s", task.id)
        return 0
    try:
        run_id = UUID(task.execution_run_id)
    except ValueError:
        logger.error("backfill invalid execution_run_id: task=%s run=%s", task.id, task.execution_run_id)
        return 0

    linked_source_ids = {
        source_id for task_id, source_id in existing_links if task_id == task.id
    }
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
        for source in sources.values()
        if str(source.id) in linked_source_ids
    ]
    config_snapshot = {
        "scope": task.scope,
        "mode": task.mode,
        "postLimit": task.post_limit,
        "groupIds": task.group_ids,
    }
    payload = {
        "config": config_snapshot,
        "sourceSet": source_set_snapshot,
        "sourceSetRevision": task.revision,
    }
    sha = snapshot_sha256(payload)
    if dry_run:
        logger.info("backfill would-create TaskRun: task=%s run=%s sha=%s...", task.id, run_id, sha[:8])
        return 1

    run = TaskRun(
        id=run_id,
        task_id=task.id,
        run_revision=1,
        status="requested",
        source_set_revision=task.revision,
        snapshot_sha256=sha,
        config_snapshot=config_snapshot,
        source_set_snapshot=source_set_snapshot,
    )
    session.add(run)
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
    logger.info("backfill TaskRun created: task=%s run=%s sha=%s...", task.id, run_id, sha[:8])
    return 1


async def run_backfill(session: AsyncSession, dry_run: bool = False) -> dict[str, Any]:
    tasks = await fetch_tasks_with_group_ids(session)
    sources = await fetch_sources(session)
    existing_links = await fetch_existing_links(session)

    linked = 0
    skipped = 0
    runs_created = 0

    for task in tasks:
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

    if dry_run:
        logger.info(
            "[DRY-RUN] Would link %d task sources (%d already linked) and create %d TaskRun baselines; no changes committed.",
            linked, skipped, runs_created,
        )
    else:
        logger.info(
            "Backfill: linked %d task sources (%d skipped), created %d TaskRun baselines.",
            linked, skipped, runs_created,
        )

    return {
        "tasks_processed": len(tasks),
        "linked": linked,
        "skipped": skipped,
        "runs_created": runs_created,
    }


async def main() -> None:
    parser = argparse.ArgumentParser(
        description="Backfill task_sources and baseline task_runs from legacy task data.",
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--dry-run", action="store_true", help="Log only; do not modify the database.")
    group.add_argument("--commit", action="store_true", help="Apply changes to the database.")
    args = parser.parse_args()

    setup_logging()
    logger.info("Running backfill (dry_run=%s)", args.dry_run)

    async with SessionLocal() as session:
        async with session.begin():
            summary = await run_backfill(session, dry_run=args.dry_run)

    logger.info("Backfill complete. Summary: %s", summary)


if __name__ == "__main__":
    asyncio.run(main())
