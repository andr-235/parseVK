#!/usr/bin/env python3
"""
ETL Migration: NestJS vk_api  ->  FastAPI microservices (identity, tasks, vk, content)

Usage:
    # Сухой прогон (read-only, без записи)
    python scripts/migrate_data.py --dry-run

    # Полная миграция
    python scripts/migrate_data.py

    # С указанием source DSN (если не через .env)
    python scripts/migrate_data.py --source-dsn "postgresql://user:pass@host:5432/vk_api"
"""

import argparse
import asyncio
import json
import logging
import os
import sys
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

import asyncpg

logger = logging.getLogger("migrate")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(logging.Formatter("%(asctime)s  %(levelname)-8s  %(message)s"))
logger.addHandler(handler)

BATCH_SIZE = 500


@dataclass
class DSNs:
    source: str = ""
    identity: str = ""
    tasks: str = ""
    vk: str = ""
    content: str = ""


def load_dsns(args: argparse.Namespace) -> DSNs:
    d = DSNs()
    d.source = args.source_dsn or os.environ.get("SOURCE_DATABASE_URL", "")
    d.identity = args.identity_dsn or os.environ.get("IDENTITY_DATABASE_URL", "")
    d.tasks = args.tasks_dsn or os.environ.get("TASKS_DATABASE_URL", "")
    d.vk = args.vk_dsn or os.environ.get("VK_SERVICE_DATABASE_URL", "")
    d.content = args.content_dsn or os.environ.get("CONTENT_DATABASE_URL", "")
    return d


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------


def std_dsn(dsn: str) -> str:
    """Remove asyncpg+ prefix if present."""
    return dsn.replace("postgresql+asyncpg://", "postgresql://")


def now() -> datetime:
    return datetime.now(timezone.utc)


def utc_from_dt(dt: datetime | None) -> datetime | None:
    if dt is None or dt.tzinfo is not None:
        return dt
    return dt.replace(tzinfo=timezone.utc)


# ---------------------------------------------------------------------------
# ETL core
# ---------------------------------------------------------------------------


class ETL:
    def __init__(self, dsns: DSNs, dry_run: bool = False):
        self.dsns = dsns
        self.dry_run = dry_run
        self.pools: dict[str, asyncpg.Pool] = {}
        self.user_map: dict[int, str] = {}  # old User.id -> new User UUID
        self.task_map: dict[int, int] = {}  # old Task.id -> new Task.id
        self.group_map: dict[int, int] = {}  # old Group.vkId -> new vk_group.id

    async def connect(self):
        logger.info("Connecting to databases …")
        targets = [
            ("source", self.dsns.source),
            ("identity", self.dsns.identity),
            ("tasks", self.dsns.tasks),
            ("vk", self.dsns.vk),
            ("content", self.dsns.content),
        ]
        for name, dsn in targets:
            if not dsn:
                raise RuntimeError(f"Missing DSN for {name}")
            self.pools[name] = await asyncpg.create_pool(std_dsn(dsn), min_size=1, max_size=4)
            logger.info("  %s connected", name)

    async def close(self):
        for name, pool in self.pools.items():
            await pool.close()
            logger.info("  %s closed", name)

    # ------------------------------------------------------------------
    # 1. Users  ->  identity-db.users
    # ------------------------------------------------------------------
    async def migrate_users(self):
        logger.info("=== Users -> identity-db ===")
        rows = await self._fetch("source", 'SELECT * FROM public."User" ORDER BY id')
        if not rows:
            logger.info("  No users to migrate")
            return

        for row in rows:
            new_id = str(uuid.uuid4())
            self.user_map[row["id"]] = new_id

            vals = {
                "id": new_id,
                "username": row["username"],
                "email": None,  # нет email в source User
                "password_hash": row["passwordHash"],
                "role": row["role"],
                "is_active": True,
                "is_superuser": row["role"] == "admin",
                "password_changed_at": utc_from_dt(row.get("createdAt")) or now(),
                "created_at": utc_from_dt(row.get("createdAt")) or now(),
                "updated_at": utc_from_dt(row.get("updatedAt")) or now(),
            }

            if not self.dry_run:
                await self._execute(
                    "identity",
                    """
                    INSERT INTO users (id, username, email, password_hash, role,
                                       is_active, is_superuser, password_changed_at,
                                       created_at, updated_at)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
                    ON CONFLICT (username) DO UPDATE
                      SET password_hash = EXCLUDED.password_hash,
                          role = EXCLUDED.role,
                          updated_at = EXCLUDED.updated_at
                    """,
                    vals["id"],
                    vals["username"],
                    vals["email"],
                    vals["password_hash"],
                    vals["role"],
                    vals["is_active"],
                    vals["is_superuser"],
                    vals["password_changed_at"],
                    vals["created_at"],
                    vals["updated_at"],
                )
        logger.info("  Users migrated: %d", len(rows))

    # ------------------------------------------------------------------
    # 2. Tasks  ->  tasks-db.tasks
    # ------------------------------------------------------------------
    async def migrate_tasks(self):
        logger.info("=== Tasks -> tasks-db ===")
        rows = await self._fetch("source", 'SELECT * FROM public."Task" ORDER BY id')
        if not rows:
            logger.info("  No tasks to migrate")
            return

        # Кому принадлежат задачи — берём первого админа
        owner_user_id = self._first_admin_uuid()

        for row in rows:
            description = None
            if row.get("description"):
                description = json.dumps({"text": row["description"]})

            status = row.get("status", "pending")
            if row.get("completed") and status == "pending":
                status = "done"

            if not self.dry_run:
                new_id = await self._fetchval(
                    "tasks",
                    """
                    INSERT INTO tasks
                        (owner_user_id, title, description, status, scope, mode,
                         group_ids, post_limit, source, total_items, processed_items,
                         progress, stats, error, created_at, updated_at)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
                    RETURNING id
                    """,
                    owner_user_id,
                    row["title"],
                    description,
                    status,
                    None,  # scope
                    None,  # mode
                    [],  # group_ids
                    None,  # post_limit
                    "manual",  # source
                    row.get("totalItems") or 0,
                    row.get("processedItems") or 0,
                    row.get("progress") or 0.0,
                    None,  # stats
                    None,  # error
                    utc_from_dt(row.get("createdAt")) or now(),
                    utc_from_dt(row.get("updatedAt")) or now(),
                )
                self.task_map[row["id"]] = new_id
        logger.info("  Tasks migrated: %d", len(rows))

    # ------------------------------------------------------------------
    # 3. TaskAuditLog  ->  tasks-db.task_audit_logs
    # ------------------------------------------------------------------
    async def migrate_task_audit_logs(self):
        logger.info("=== TaskAuditLog -> tasks-db ===")
        rows = await self._fetch("source", "SELECT * FROM public.task_audit_logs ORDER BY id")
        if not rows:
            logger.info("  No audit logs to migrate")
            return

        owner_user_id = self._first_admin_uuid()

        def _build(row):
            new_task_id = self.task_map.get(row["taskId"])
            if new_task_id is None:
                return None
            return (
                owner_user_id,
                "task",
                str(new_task_id),
                new_task_id,
                row["eventType"],
                json.dumps(row.get("eventData")) if row.get("eventData") else None,
                utc_from_dt(row.get("createdAt")) or now(),
            )

        if not self.dry_run:
            batch = []
            for row in rows:
                rec = _build(row)
                if rec:
                    batch.append(rec)
                if len(batch) >= BATCH_SIZE:
                    await self._executemany(
                        "tasks",
                        """
                        INSERT INTO task_audit_logs
                            (owner_user_id, aggregate_type, aggregate_id, task_id,
                             event_type, event_data, created_at)
                        VALUES ($1,$2,$3,$4,$5,$6,$7)
                        """,
                        batch,
                    )
                    batch.clear()
            if batch:
                await self._executemany(
                    "tasks",
                    """
                    INSERT INTO task_audit_logs
                        (owner_user_id, aggregate_type, aggregate_id, task_id,
                         event_type, event_data, created_at)
                    VALUES ($1,$2,$3,$4,$5,$6,$7)
                    """,
                    batch,
                )
        logger.info("  Audit logs migrated: %d", len(rows))

    # ------------------------------------------------------------------
    # 4. TaskAutomationSettings  ->  tasks-db.task_automation_settings
    # ------------------------------------------------------------------
    async def migrate_task_automation_settings(self):
        logger.info("=== TaskAutomationSettings -> tasks-db ===")
        rows = await self._fetch(
            "source", 'SELECT * FROM public."TaskAutomationSettings" ORDER BY id'
        )
        if not rows:
            logger.info("  No automation settings to migrate")
            return

        owner_user_id = self._first_admin_uuid()
        row = rows[0]
        if not self.dry_run:
            await self._execute(
                "tasks",
                """
                INSERT INTO task_automation_settings
                    (owner_user_id, enabled, run_hour, run_minute, post_limit,
                     timezone_offset_minutes, last_run_at, created_at, updated_at)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                ON CONFLICT (owner_user_id) DO UPDATE
                  SET enabled = EXCLUDED.enabled,
                      updated_at = EXCLUDED.updated_at
                """,
                owner_user_id,
                row.get("enabled") or False,
                row.get("runHour") or 3,
                row.get("runMinute") or 0,
                row.get("postLimit") or 10,
                row.get("timezoneOffsetMinutes") or 0,
                utc_from_dt(row.get("lastRunAt")),
                utc_from_dt(row.get("createdAt")) or now(),
                utc_from_dt(row.get("updatedAt")) or now(),
            )
        logger.info("  Automation settings migrated: %d", len(rows))

    # ------------------------------------------------------------------
    # 5. Groups  ->  vk-db.vk_groups  +  content-db.content_groups
    # ------------------------------------------------------------------
    async def migrate_groups(self):
        logger.info("=== Groups -> vk-db + content-db ===")
        rows = await self._fetch("source", 'SELECT * FROM public."Group" ORDER BY id')
        if not rows:
            logger.info("  No groups to migrate")
            return

        for row in rows:
            vk_group_id = row["vkId"]

            raw = self._build_raw(
                row,
                [
                    "isClosed",
                    "deactivated",
                    "type",
                    "photo50",
                    "photo100",
                    "photo200",
                    "activity",
                    "ageLimits",
                    "description",
                    "membersCount",
                    "status",
                    "verified",
                    "wall",
                    "addresses",
                    "city",
                    "counters",
                ],
            )
            is_closed = None
            if row.get("isClosed") is not None:
                is_closed = bool(row["isClosed"])

            if not self.dry_run:
                gid = await self._fetchval(
                    "vk",
                    """
                    INSERT INTO vk_groups
                        (vk_group_id, screen_name, name, is_closed, raw,
                         first_seen_at, last_seen_at)
                    VALUES ($1,$2,$3,$4,$5,$6,$7)
                    ON CONFLICT (vk_group_id) DO UPDATE
                      SET name = EXCLUDED.name,
                          screen_name = EXCLUDED.screen_name,
                          raw = EXCLUDED.raw,
                          last_seen_at = EXCLUDED.last_seen_at
                    RETURNING id
                    """,
                    vk_group_id,
                    row.get("screenName"),
                    row.get("name"),
                    is_closed,
                    json.dumps(raw),
                    utc_from_dt(row.get("createdAt")) or now(),
                    utc_from_dt(row.get("updatedAt")) or now(),
                )
                self.group_map[vk_group_id] = gid

                await self._execute(
                    "content",
                    """
                    INSERT INTO content_groups
                        (vk_group_id, screen_name, name, last_collected_at, updated_at)
                    VALUES ($1,$2,$3,$4,$5)
                    ON CONFLICT (vk_group_id) DO UPDATE
                      SET name = EXCLUDED.name,
                          screen_name = EXCLUDED.screen_name,
                          last_collected_at = EXCLUDED.last_collected_at,
                          updated_at = EXCLUDED.updated_at
                    """,
                    vk_group_id,
                    row.get("screenName"),
                    row.get("name"),
                    utc_from_dt(row.get("updatedAt")),
                    now(),
                )
        logger.info("  Groups migrated: %d", len(rows))

    # ------------------------------------------------------------------
    # 6. Authors  ->  vk-db.vk_authors  +  content-db.content_authors
    # ------------------------------------------------------------------
    async def migrate_authors(self):
        logger.info("=== Authors -> vk-db + content-db ===")
        rows = await self._fetch("source", 'SELECT * FROM public."Author" ORDER BY id')
        if not rows:
            logger.info("  No authors to migrate")
            return

        for row in rows:
            vk_author_id = row["vkUserId"]
            first = row.get("firstName") or ""
            last = row.get("lastName") or ""
            display_name = f"{first} {last}".strip() or None

            sex = row.get("sex")  # 1=woman, 2=man, 0=unknown
            author_type = "unknown"
            if sex == 1:
                author_type = "woman"
            elif sex == 2:
                author_type = "man"

            raw = self._build_raw(
                row,
                [
                    "firstName",
                    "lastName",
                    "deactivated",
                    "domain",
                    "screenName",
                    "isClosed",
                    "canAccessClosed",
                    "photo50",
                    "photo100",
                    "photo200",
                    "photo200Orig",
                    "photo400Orig",
                    "photoMax",
                    "photoMaxOrig",
                    "photoId",
                    "city",
                    "country",
                    "about",
                    "activities",
                    "bdate",
                    "books",
                    "career",
                    "connections",
                    "contacts",
                    "counters",
                    "education",
                    "followersCount",
                    "homeTown",
                    "interests",
                    "lastSeen",
                    "maidenName",
                    "military",
                    "movies",
                    "music",
                    "nickname",
                    "occupation",
                    "personal",
                    "relatives",
                    "relation",
                    "schools",
                    "sex",
                    "site",
                    "status",
                    "timezone",
                    "tv",
                    "universities",
                    "verifiedAt",
                ],
            )

            if not self.dry_run:
                await self._execute(
                    "vk",
                    """
                    INSERT INTO vk_authors
                        (vk_author_id, type, display_name, raw,
                         first_seen_at, last_seen_at)
                    VALUES ($1,$2,$3,$4,$5,$6)
                    ON CONFLICT (vk_author_id) DO UPDATE
                      SET type = EXCLUDED.type,
                          display_name = EXCLUDED.display_name,
                          raw = EXCLUDED.raw,
                          last_seen_at = EXCLUDED.last_seen_at
                    """,
                    vk_author_id,
                    author_type,
                    display_name,
                    json.dumps(raw),
                    utc_from_dt(row.get("createdAt")) or now(),
                    utc_from_dt(row.get("updatedAt")) or now(),
                )

                await self._execute(
                    "content",
                    """
                    INSERT INTO content_authors
                        (vk_author_id, type, display_name, updated_at)
                    VALUES ($1,$2,$3,$4)
                    ON CONFLICT (vk_author_id) DO UPDATE
                      SET type = EXCLUDED.type,
                          display_name = EXCLUDED.display_name,
                          updated_at = EXCLUDED.updated_at
                    """,
                    vk_author_id,
                    author_type,
                    display_name,
                    now(),
                )
        logger.info("  Authors migrated: %d", len(rows))

    # ------------------------------------------------------------------
    # 7. Posts  ->  vk-db.vk_posts  +  content-db.content_posts
    # ------------------------------------------------------------------
    async def migrate_posts(self):
        logger.info("=== Posts -> vk-db + content-db ===")
        rows = await self._fetch("source", 'SELECT * FROM public."Post" ORDER BY id')
        if not rows:
            logger.info("  No posts to migrate")
            return

        count = 0
        for row in rows:
            vk_owner_id = row["ownerId"]
            vk_post_id = row["vkPostId"]
            vk_group_id = row.get("groupId")
            author_vk_id = row.get("fromId")

            raw = self._build_raw(
                row,
                [
                    "fromId",
                    "attachments",
                    "commentsCount",
                    "commentsCanPost",
                    "commentsGroupsCanPost",
                    "commentsCanClose",
                    "commentsCanOpen",
                ],
            )

            if not self.dry_run:
                await self._execute(
                    "vk",
                    """
                    INSERT INTO vk_posts
                        (vk_owner_id, vk_post_id, vk_group_id, author_vk_id,
                         date, text, raw, first_task_id, last_task_id,
                         first_seen_at, last_seen_at)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
                    ON CONFLICT (vk_owner_id, vk_post_id) DO UPDATE
                      SET text = EXCLUDED.text,
                          raw = EXCLUDED.raw,
                          last_seen_at = EXCLUDED.last_seen_at
                    """,
                    vk_owner_id,
                    vk_post_id,
                    vk_group_id,
                    author_vk_id,
                    utc_from_dt(row.get("postedAt")),
                    row.get("text"),
                    json.dumps(raw),
                    0,  # first_task_id — нет в source
                    0,  # last_task_id
                    utc_from_dt(row.get("createdAt")) or now(),
                    utc_from_dt(row.get("updatedAt")) or now(),
                )

                external_key = f"vk_{vk_owner_id}_{vk_post_id}"
                await self._execute(
                    "content",
                    """
                    INSERT INTO content_posts
                        (external_key, vk_owner_id, vk_post_id, vk_group_id,
                         author_vk_id, date, text, comments_count,
                         last_collected_task_id, updated_at)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
                    ON CONFLICT (external_key) DO UPDATE
                      SET text = EXCLUDED.text,
                          comments_count = EXCLUDED.comments_count,
                          updated_at = EXCLUDED.updated_at
                    """,
                    external_key,
                    vk_owner_id,
                    vk_post_id,
                    vk_group_id,
                    author_vk_id,
                    utc_from_dt(row.get("postedAt")),
                    row.get("text"),
                    row.get("commentsCount") or 0,
                    None,  # last_collected_task_id
                    now(),
                )
            count += 1
            if count % BATCH_SIZE == 0:
                logger.info("  Posts: %d", count)
        logger.info("  Posts migrated: %d", count)

    # ------------------------------------------------------------------
    # 8. Comments  ->  vk-db.vk_comments  +  content-db.content_comments
    # ------------------------------------------------------------------
    async def migrate_comments(self):
        logger.info("=== Comments -> vk-db + content-db ===")
        rows = await self._fetch("source", 'SELECT * FROM public."Comment" ORDER BY id')
        if not rows:
            logger.info("  No comments to migrate")
            return

        count = 0
        for row in rows:
            vk_owner_id = row["ownerId"]
            vk_post_id = row.get("postId")
            vk_comment_id = row["vkCommentId"]
            author_vk_id = row.get("fromId") or row.get("authorVkId")

            raw = self._build_raw(
                row,
                [
                    "fromId",
                    "likesCount",
                    "parentsStack",
                    "threadCount",
                    "threadItems",
                    "attachments",
                    "replyToUser",
                    "replyToComment",
                    "isDeleted",
                    "isRead",
                    "source",
                    "watchlistAuthorId",
                ],
            )

            if not self.dry_run:
                await self._execute(
                    "vk",
                    """
                    INSERT INTO vk_comments
                        (vk_owner_id, vk_post_id, vk_comment_id, author_vk_id,
                         date, text, raw, first_task_id, last_task_id,
                         first_seen_at, last_seen_at)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
                    ON CONFLICT (vk_owner_id, vk_post_id, vk_comment_id) DO UPDATE
                      SET text = EXCLUDED.text,
                          raw = EXCLUDED.raw,
                          last_seen_at = EXCLUDED.last_seen_at
                    """,
                    vk_owner_id,
                    vk_post_id,
                    vk_comment_id,
                    author_vk_id,
                    utc_from_dt(row.get("publishedAt")),
                    row.get("text"),
                    json.dumps(raw),
                    0,  # first_task_id
                    0,  # last_task_id
                    utc_from_dt(row.get("createdAt")) or now(),
                    utc_from_dt(row.get("updatedAt")) or now(),
                )

                external_key = f"vk_{vk_owner_id}_{vk_post_id}_{vk_comment_id}"
                post_external_key = f"vk_{vk_owner_id}_{vk_post_id}"
                await self._execute(
                    "content",
                    """
                    INSERT INTO content_comments
                        (external_key, post_external_key,
                         vk_owner_id, vk_post_id, vk_comment_id,
                         author_vk_id, date, text,
                         last_collected_task_id, updated_at)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
                    ON CONFLICT (external_key) DO UPDATE
                      SET text = EXCLUDED.text,
                          updated_at = EXCLUDED.updated_at
                    """,
                    external_key,
                    post_external_key,
                    vk_owner_id,
                    vk_post_id,
                    vk_comment_id,
                    author_vk_id,
                    utc_from_dt(row.get("publishedAt")),
                    row.get("text"),
                    None,
                    now(),
                )
            count += 1
            if count % BATCH_SIZE == 0:
                logger.info("  Comments: %d", count)
        logger.info("  Comments migrated: %d", count)

    # ------------------------------------------------------------------
    # helpers
    # ------------------------------------------------------------------

    def _first_admin_uuid(self) -> str:
        if not self.user_map:
            return str(uuid.uuid4())
        return next(iter(self.user_map.values()))

    def _build_raw(self, row: dict, fields: list[str]) -> dict:
        result = {}
        for f in fields:
            v = row.get(f)
            if v is not None:
                if isinstance(v, datetime):
                    v = v.isoformat()
                result[f] = v
        return result

    async def _fetch(self, pool_name: str, query: str, *args) -> list[dict]:
        async with self.pools[pool_name].acquire() as conn:
            rows = await conn.fetch(query, *args)
            return [dict(r) for r in rows]

    async def _fetchval(self, pool_name: str, query: str, *args) -> Any:
        async with self.pools[pool_name].acquire() as conn:
            return await conn.fetchval(query, *args)

    async def _execute(self, pool_name: str, query: str, *args):
        async with self.pools[pool_name].acquire() as conn:
            await conn.execute(query, *args)

    async def _executemany(self, pool_name: str, query: str, args_list: list[tuple]):
        async with self.pools[pool_name].acquire() as conn:
            await conn.executemany(query, args_list)

    # ------------------------------------------------------------------
    # run
    # ------------------------------------------------------------------
    async def run(self):
        logger.info("Dry-run: %s", self.dry_run)
        await self.connect()
        try:
            await self.migrate_users()
            await self.migrate_tasks()
            await self.migrate_task_audit_logs()
            await self.migrate_task_automation_settings()
            await self.migrate_groups()
            await self.migrate_authors()
            await self.migrate_posts()
            await self.migrate_comments()
        finally:
            await self.close()

        logger.info("Migration complete! Dry-run: %s", self.dry_run)
        if not self.dry_run:
            logger.info(
                "User map: %d users, Task map: %d tasks, Group map: %d groups",
                len(self.user_map),
                len(self.task_map),
                len(self.group_map),
            )


# ---------------------------------------------------------------------------
# entry
# ---------------------------------------------------------------------------


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Migrate vk_api -> microservices")
    p.add_argument("--dry-run", action="store_true", help="Read-only, no writes")
    p.add_argument("--source-dsn", help="Source DB (vk_api)")
    p.add_argument("--identity-dsn", help="Identity DB")
    p.add_argument("--tasks-dsn", help="Tasks DB")
    p.add_argument("--vk-dsn", help="VK DB")
    p.add_argument("--content-dsn", help="Content DB")
    return p.parse_args(argv)


async def main():
    args = parse_args()
    dsns = load_dsns(args)

    missing = [k for k, v in dsns.__dict__.items() if not v]
    if missing:
        print(f"Missing DSN variables: {', '.join(missing)}", file=sys.stderr)
        print("Set env vars or pass --*-dsn flags", file=sys.stderr)
        sys.exit(1)

    etl = ETL(dsns, dry_run=args.dry_run)
    await etl.run()


if __name__ == "__main__":
    asyncio.run(main())
