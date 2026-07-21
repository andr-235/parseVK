#!/usr/bin/env python3
"""Backfill MonitoringGroup.im_group_id from existing or stub ImGroup rows."""

from __future__ import annotations

import argparse
import asyncio
import logging
import sys
from pathlib import Path
from typing import Any

# Ensure the service root is on sys.path so `app` imports work when the script
# is executed directly from any working directory.
_SERVICE_ROOT = Path(__file__).resolve().parent.parent
if str(_SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(_SERVICE_ROOT))

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

from app.core.config import settings
from app.db.models import ImGroup, MonitoringGroup
from app.db.session import SessionLocal

logger = logging.getLogger("backfill_im_group_id")


def setup_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S%z",
    )


async def count_null_im_group_ids(session: Any) -> int:
    stmt = (
        select(func.count())
        .select_from(MonitoringGroup)
        .where(MonitoringGroup.im_group_id.is_(None))
    )
    result = await session.execute(stmt)
    return result.scalar_one()


async def fetch_monitoring_groups_with_null_im_group_id(session: Any) -> list[MonitoringGroup]:
    stmt = select(MonitoringGroup).where(MonitoringGroup.im_group_id.is_(None))
    result = await session.scalars(stmt)
    return list(result.all())


async def find_im_group(
    session: Any,
    messenger: str,
    external_chat_id: str,
    lookup: dict[tuple[str, str], ImGroup],
) -> ImGroup | None:
    key = (messenger, external_chat_id)
    if key in lookup:
        return lookup[key]

    stmt = select(ImGroup).where(
        ImGroup.messenger == messenger,
        ImGroup.external_chat_id == external_chat_id,
    )
    result = await session.scalars(stmt)
    existing = result.first()
    if existing is not None:
        lookup[key] = existing
    return existing


async def process_group(
    session: Any,
    mg: MonitoringGroup,
    lookup: dict[tuple[str, str], ImGroup],
    dry_run: bool,
) -> tuple[str, Any]:
    """Process a single MonitoringGroup and return a status tuple.

    Status values:
      - matched: an existing ImGroup was found and linked.
      - stub_created: a new stub ImGroup was created and linked.
      - would_create_stub: dry-run only, would have created a stub.
      - error: failed to create a stub or link the row (e.g. constraint violation).
    """
    im_group = await find_im_group(session, mg.messenger, mg.chat_id, lookup)
    if im_group is not None:
        if not dry_run:
            mg.im_group_id = im_group.id
        return ("matched", im_group.id)

    if dry_run:
        return ("would_create_stub", None)

    try:
        async with session.begin_nested():
            # Re-check inside the savepoint to guard against concurrent inserts.
            im_group = await find_im_group(session, mg.messenger, mg.chat_id, lookup)
            if im_group is not None:
                mg.im_group_id = im_group.id
                return ("matched", im_group.id)

            origin_marker = {"origin": "monitoring_group_backfill", "monitoring_group_id": mg.id}
            stub = ImGroup(
                messenger=mg.messenger,
                external_chat_id=mg.chat_id,
                name=mg.name,
                category=mg.category,
                raw=origin_marker,
            )
            session.add(stub)
            await session.flush()
            logger.info(
                "Created stub ImGroup id=%d for MonitoringGroup id=%d with origin=%s",
                stub.id,
                mg.id,
                origin_marker["origin"],
            )
            lookup[(mg.messenger, mg.chat_id)] = stub
            mg.im_group_id = stub.id
            return ("stub_created", stub.id)
    except IntegrityError as exc:
        return ("error", exc)


async def run_backfill(session: Any, dry_run: bool = False) -> dict[str, Any]:
    null_count_before = await count_null_im_group_ids(session)
    logger.info("Backfill starting. NULL im_group_id rows before: %d", null_count_before)

    if null_count_before == 0:
        logger.info("No NULL rows found. Nothing to do.")
        return {
            "null_count_before": 0,
            "resolved": 0,
            "stubs_created": 0,
            "errors": 0,
        }

    groups = await fetch_monitoring_groups_with_null_im_group_id(session)
    lookup: dict[tuple[str, str], ImGroup] = {}
    resolved = 0
    stubs_created = 0
    errors = 0

    for mg in groups:
        status, detail = await process_group(session, mg, lookup, dry_run)

        if status == "matched":
            logger.info("Backfill: MonitoringGroup id=%d → im_group_id=%d", mg.id, detail)
            resolved += 1
        elif status == "stub_created":
            logger.warning(
                "Created stub ImGroup for unmatched MonitoringGroup id=%d messenger=%s chat_id=%s",
                mg.id,
                mg.messenger,
                mg.chat_id,
            )
            logger.info("Backfill: MonitoringGroup id=%d → im_group_id=%d", mg.id, detail)
            resolved += 1
            stubs_created += 1
        elif status == "would_create_stub":
            logger.warning(
                "[DRY-RUN] No ImGroup found for MonitoringGroup id=%d (messenger=%s, chat_id=%s); would create stub",
                mg.id,
                mg.messenger,
                mg.chat_id,
            )
        elif status == "error":
            logger.error(
                "Failed to create stub or link MonitoringGroup id=%d (messenger=%s, chat_id=%s): %s",
                mg.id,
                mg.messenger,
                mg.chat_id,
                detail,
            )
            errors += 1

    if dry_run:
        logger.info(
            "[DRY-RUN] Would resolve %d rows and create %d stub ImGroups; no changes committed.",
            resolved,
            stubs_created,
        )
    else:
        logger.info(
            "Backfill committing: resolved %d rows, created %d stub ImGroups, %d errors.",
            resolved,
            stubs_created,
            errors,
        )

    return {
        "null_count_before": null_count_before,
        "resolved": resolved,
        "stubs_created": stubs_created,
        "errors": errors,
    }


async def verify_no_nulls(session: Any) -> int:
    null_count = await count_null_im_group_ids(session)
    if null_count > 0:
        remaining = await fetch_monitoring_groups_with_null_im_group_id(session)
        ids = [mg.id for mg in remaining]
        logger.error(
            "Backfill verification failed: %d MonitoringGroup row(s) still have NULL im_group_id: %s",
            null_count,
            ids,
        )
        raise RuntimeError(f"Backfill incomplete: {null_count} row(s) still NULL: {ids}")

    logger.info("Backfill verification passed: no NULL im_group_id rows remain.")
    return null_count


async def main() -> None:
    parser = argparse.ArgumentParser(
        description="Backfill MonitoringGroup.im_group_id from ImGroup rows.",
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "--dry-run",
        action="store_true",
        help="Count and log only; do not modify the database.",
    )
    group.add_argument(
        "--commit",
        action="store_true",
        help="Apply changes to the database.",
    )
    args = parser.parse_args()

    setup_logging()
    logger.info("Running backfill (dry_run=%s)", args.dry_run)

    async with SessionLocal() as session:
        async with session.begin():
            summary = await run_backfill(session, dry_run=args.dry_run)

        if not args.dry_run:
            async with session.begin():
                await verify_no_nulls(session)

    logger.info("Backfill complete. Summary: %s", summary)


if __name__ == "__main__":
    asyncio.run(main())
