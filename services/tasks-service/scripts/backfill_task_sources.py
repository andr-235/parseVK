#!/usr/bin/env python3
"""Backfill normalized task sources and immutable TaskRun snapshots."""

from __future__ import annotations

import argparse
import asyncio
import logging
import sys
from pathlib import Path

_SERVICE_ROOT = Path(__file__).resolve().parent.parent
if str(_SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(_SERVICE_ROOT))

from app.db.session import SessionLocal  # noqa: E402
from scripts.backfill_sources.identity import (  # noqa: E402
    SourceKey,
    source_key,
    stable_source_id,
)
from scripts.backfill_sources.processor import (  # noqa: E402
    fetch_existing_links,
    fetch_sources,
    fetch_tasks,
    process_task_run_baseline,
    process_task_sources,
    run_backfill,
)
from scripts.backfill_sources.snapshots import (  # noqa: E402
    canonical_json,
    snapshot_sha256,
)

logger = logging.getLogger("backfill_task_sources")

__all__ = [
    "SourceKey",
    "canonical_json",
    "fetch_existing_links",
    "fetch_sources",
    "fetch_tasks",
    "process_task_run_baseline",
    "process_task_sources",
    "run_backfill",
    "snapshot_sha256",
    "source_key",
    "stable_source_id",
]


def setup_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S%z",
    )


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
