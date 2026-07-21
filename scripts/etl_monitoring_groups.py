#!/usr/bin/env python3
"""ETL: Migrate monitoring_groups from content-service to im-service."""

from __future__ import annotations

import argparse
import asyncio
import logging
import os
from dataclasses import dataclass, field
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

logger = logging.getLogger(__name__)

CHAT_ID_MAX_LENGTH = 256
MONITORING_GROUPS_TABLE = "monitoring_groups"


@dataclass
class DbConfig:
    content_url: str
    im_url: str


@dataclass
class ETLStats:
    content_count: int = 0
    im_count_before: int = 0
    im_count_after: int = 0
    inserted: int = 0
    skipped: int = 0
    truncated: int = 0
    no_im_group: list[int] = field(default_factory=list)
    errors: int = 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Migrate monitoring_groups from content-service to im-service",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Only count and log, don't modify anything",
    )
    parser.add_argument(
        "--commit",
        action="store_true",
        help="Actually perform the writes",
    )
    parser.add_argument(
        "--content-url",
        default=None,
        help="Content DB URL (default: from env CONTENT_DATABASE_URL)",
    )
    parser.add_argument(
        "--im-url",
        default=None,
        help="IM DB URL (default: from env IM_DATABASE_URL)",
    )
    return parser.parse_args()


def load_db_config(args: argparse.Namespace) -> DbConfig:
    content_url = args.content_url or os.getenv(
        "CONTENT_DATABASE_URL",
        "postgresql+asyncpg://content:password@localhost:5432/content",
    )
    im_url = (
        args.im_url
        or os.getenv(
            "IM_DATABASE_URL",
        )
        or os.getenv(
            "IM_SERVICE_DATABASE_URL",
            "postgresql+asyncpg://im:password@localhost:5432/im",
        )
    )
    return DbConfig(content_url=content_url, im_url=im_url)


async def _count_rows(session: AsyncSession, table: str) -> int:
    result = await session.execute(text(f"SELECT COUNT(*) FROM {table}"))
    return result.scalar() or 0


async def _count_distinct_messenger_chat_id(session: AsyncSession, table: str) -> int:
    result = await session.execute(
        text(f"SELECT COUNT(DISTINCT messenger, chat_id) FROM {table}"),
    )
    return result.scalar() or 0


async def _category_distribution(session: AsyncSession, table: str) -> dict[str | None, int]:
    result = await session.execute(
        text(f"SELECT category, COUNT(*) FROM {table} GROUP BY category ORDER BY category"),
    )
    rows = result.all()
    return {row[0]: row[1] for row in rows}


async def _truncate_chat_id(chat_id: str, row_id: int, stats: ETLStats) -> str:
    original_len = len(chat_id)
    if original_len > CHAT_ID_MAX_LENGTH:
        truncated = chat_id[:CHAT_ID_MAX_LENGTH]
        stats.truncated += 1
        logger.warning(
            "Truncated chat_id from %d to 256 for content group id=%d",
            original_len,
            row_id,
        )
        return truncated
    return chat_id


async def _find_im_group_id(
    im_session: AsyncSession,
    messenger: str,
    chat_id: str,
) -> int | None:
    result = await im_session.execute(
        text(
            "SELECT id FROM im_groups WHERE messenger = :messenger AND external_chat_id = :chat_id",
        ),
        {"messenger": messenger, "chat_id": chat_id},
    )
    row = result.one_or_none()
    return row[0] if row else None


async def _insert_monitoring_group(
    im_session: AsyncSession,
    row: Any,
    chat_id: str,
    im_group_id: int,
    stats: ETLStats,
) -> None:
    try:
        result = await im_session.execute(
            text(
                """
                INSERT INTO monitoring_groups (
                    messenger, chat_id, name, category, created_at, updated_at, im_group_id
                )
                VALUES (
                    :messenger, :chat_id, :name, :category, :created_at, :updated_at, :im_group_id
                )
                ON CONFLICT (messenger, chat_id) DO NOTHING
                """,
            ),
            {
                "messenger": row.messenger,
                "chat_id": chat_id,
                "name": row.name,
                "category": row.category,
                "created_at": row.created_at,
                "updated_at": row.updated_at,
                "im_group_id": im_group_id,
            },
        )
        if result.rowcount > 0:
            stats.inserted += 1
            logger.info(
                "Migrated content group id=%d to im-service (im_group_id=%d)",
                row.id,
                im_group_id,
            )
        else:
            stats.skipped += 1
            if len(row.chat_id) > CHAT_ID_MAX_LENGTH:
                logger.warning(
                    "Skipped duplicate after truncation: messenger=%s chat_id=%s (was %s)",
                    row.messenger,
                    chat_id,
                    row.chat_id,
                )
            else:
                logger.info(
                    "Skipped duplicate: messenger=%s chat_id=%s (content group id=%d)",
                    row.messenger,
                    chat_id,
                    row.id,
                )
    except Exception as exc:
        logger.error("Failed to insert group id=%d: %s", row.id, exc)
        stats.errors += 1


async def run_etl(
    content_session: AsyncSession,
    im_session: AsyncSession,
    dry_run: bool,
) -> ETLStats:
    stats = ETLStats()

    stats.im_count_before = await _count_rows(im_session, MONITORING_GROUPS_TABLE)

    result = await content_session.execute(
        text(
            "SELECT id, messenger, chat_id, name, category, created_at, updated_at "
            "FROM monitoring_groups ORDER BY id",
        ),
    )
    rows = result.all()
    stats.content_count = len(rows)

    logger.info(
        "ETL: content.monitoring_groups count=%d, im.monitoring_groups count=%d",
        stats.content_count,
        stats.im_count_before,
    )

    if dry_run:
        logger.info("DRY RUN — no changes will be made")
        return stats

    for row in rows:
        chat_id = await _truncate_chat_id(row.chat_id, row.id, stats)

        im_group_id = await _find_im_group_id(im_session, row.messenger, chat_id)
        if im_group_id is None:
            stats.no_im_group.append(row.id)
            logger.warning(
                "No ImGroup found for content group id=%d (messenger=%s, chat_id=%s)",
                row.id,
                row.messenger,
                chat_id,
            )
            continue

        await _insert_monitoring_group(im_session, row, chat_id, im_group_id, stats)

    return stats


async def verify_migration(
    content_session: AsyncSession,
    im_session: AsyncSession,
    stats: ETLStats,
) -> None:
    stats.im_count_after = await _count_rows(im_session, MONITORING_GROUPS_TABLE)
    content_distinct = await _count_distinct_messenger_chat_id(
        content_session,
        MONITORING_GROUPS_TABLE,
    )
    im_distinct = await _count_distinct_messenger_chat_id(
        im_session,
        MONITORING_GROUPS_TABLE,
    )
    content_categories = await _category_distribution(
        content_session,
        MONITORING_GROUPS_TABLE,
    )
    im_categories = await _category_distribution(im_session, MONITORING_GROUPS_TABLE)

    logger.info("=== ETL Results ===")
    logger.info("Content count: %d", stats.content_count)
    logger.info("IM count before: %d", stats.im_count_before)
    logger.info("IM count after: %d", stats.im_count_after)
    logger.info("Inserted: %d, Skipped (duplicate): %d", stats.inserted, stats.skipped)
    logger.info("Chat IDs truncated: %d", stats.truncated)
    logger.info("Content DISTINCT(messenger, chat_id): %d", content_distinct)
    logger.info("IM DISTINCT(messenger, chat_id): %d", im_distinct)

    if content_categories != im_categories:
        logger.warning("Categorical distributions do not match")
        logger.warning("Content categories: %s", content_categories)
        logger.warning("IM categories: %s", im_categories)
    else:
        logger.info("Categorical distributions match: %s", content_categories)

    if stats.no_im_group:
        logger.warning("Groups without ImGroup: %s", stats.no_im_group)

    if stats.errors:
        logger.warning("Errors during migration: %d", stats.errors)


def print_stats(stats: ETLStats) -> None:
    print("\nETL Statistics:")
    print(f"  Content rows:     {stats.content_count}")
    print(f"  IM rows (before): {stats.im_count_before}")
    print(f"  IM rows (after):  {stats.im_count_after}")
    print(f"  Inserted:         {stats.inserted}")
    print(f"  Skipped (dup):    {stats.skipped}")
    print(f"  Truncated:        {stats.truncated}")
    if stats.no_im_group:
        print(f"  No ImGroup IDs:   {stats.no_im_group}")
    if stats.errors:
        print(f"  Errors:           {stats.errors}")


async def main() -> None:
    args = parse_args()

    if not args.dry_run and not args.commit:
        logger.info("Use --commit to actually perform the migration, or --dry-run for a preview")
        return

    config = load_db_config(args)

    content_engine = create_async_engine(config.content_url)
    im_engine = create_async_engine(config.im_url)

    try:
        async with AsyncSession(content_engine) as content_session:
            async with AsyncSession(im_engine) as im_session:
                stats = await run_etl(content_session, im_session, dry_run=args.dry_run)

                if not args.dry_run:
                    await im_session.commit()
                    await verify_migration(content_session, im_session, stats)

                print_stats(stats)
    finally:
        await content_engine.dispose()
        await im_engine.dispose()


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
    )
    asyncio.run(main())
