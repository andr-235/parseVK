#!/usr/bin/env python3
"""Upsert engine: migrate legacy data from staging DB to microservice databases.

Usage:
    python upsert.py --service identity     # restore one service
    python upsert.py --service all           # restore all services
    python upsert.py --dry-run               # preview without inserting
"""

import argparse
import asyncio
import json
import logging
import os
import sys
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Callable

import asyncpg

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("upsert")

# ---------------------------------------------------------------------------
# Connection helpers
# ---------------------------------------------------------------------------

STAGING_DSN = os.getenv(
    "STAGING_DSN",
    "postgresql://staging:staging@127.0.0.1:54329/staging",
)


def _default_target_dsn(service: str) -> str:
    env_map = {
        "identity": "IDENTITY_DSN",
        "tasks": "TASKS_DSN",
        "vk": "VK_SERVICE_DSN",
        "content": "CONTENT_DSN",
        "moderation": "MODERATION_DSN",
        "telegram": "TELEGRAM_DSN",
        "listings": "LISTINGS_DSN",
        "im": "IM_DSN",
    }
    env_key = env_map.get(service, f"{service.upper()}_DSN")
    return os.getenv(
        env_key,
        f"postgresql://{service}:{service}_dev_password_change_me@127.0.0.1:5432/{service}",
    )


# ---------------------------------------------------------------------------
# Column mapping DSL
# ---------------------------------------------------------------------------

@dataclass
class ColumnMap:
    """Maps a legacy column to a target column with optional transform.

    If select_only is True, the column is fetched from legacy but not
    inserted into the target (useful for transform dependencies).
    """
    legacy: str
    target: str
    transform: Callable[[Any], Any] | None = None
    select_only: bool = False


def const(value: Any) -> Callable:
    """Return a function that always returns the given value."""
    return lambda _: value


def map_ts(legacy_val: Any) -> datetime | None:
    """Convert legacy timestamp to timezone-aware datetime."""
    if legacy_val is None:
        return None
    if isinstance(legacy_val, datetime):
        if legacy_val.tzinfo is None:
            return legacy_val.replace(tzinfo=timezone.utc)
        return legacy_val
    return legacy_val


def map_bool(val: Any) -> bool:
    if val is None:
        return False
    if isinstance(val, int):
        return val != 0
    return bool(val)


def map_int(val: Any) -> int | None:
    if val is None:
        return None
    return int(val)


def gen_uuid(_: Any = None) -> str:
    return str(uuid.uuid4())


def now_utc(_: Any = None) -> datetime:
    return datetime.now(timezone.utc)


def json_dumps(val: Any) -> str | None:
    if val is None:
        return None
    if isinstance(val, (dict, list)):
        return json.dumps(val, default=str)
    return str(val)


def raw_to_json(val: Any) -> str | None:
    """Store legacy row as JSON string for JSONB field."""
    if val is None:
        return None
    return json.dumps(val, default=str)


# ---------------------------------------------------------------------------
# Service migration definitions
# ---------------------------------------------------------------------------

@dataclass
class TableMapping:
    """Defines how to migrate one legacy table to one target table."""
    legacy_table: str
    target_table: str
    columns: list[ColumnMap]
    conflict_target: str | list[str]  # column(s) for ON CONFLICT DO UPDATE
    batch_size: int = 500
    order_by: str | None = None
    filter_where: str | None = None  # optional WHERE clause on legacy side
    conflict_action: str = "update"  # "update" or "nothing"


SERVICE_MIGRATIONS: dict[str, list[TableMapping]] = {
    "identity": [
        TableMapping(
            legacy_table='"User"',
            target_table="users",
            columns=[
                ColumnMap("username", "username"),
                ColumnMap("passwordHash", "password_hash"),
                ColumnMap("role", "role"),
                ColumnMap("createdAt", "created_at", map_ts),
                ColumnMap("updatedAt", "updated_at", map_ts),
                ColumnMap(None, "id", gen_uuid),
                ColumnMap(None, "email", const(None)),
                ColumnMap(None, "is_active", const(True)),
                ColumnMap(None, "is_superuser",
                          lambda r: r.get("role") == "admin" if r else False),
                ColumnMap(None, "password_changed_at", now_utc),
            ],
            conflict_target="username",
            batch_size=10,
            conflict_action="nothing",
        ),
    ],
    "tasks": [
        TableMapping(
            legacy_table='"Task"',
            target_table="tasks",
            columns=[
                ColumnMap("id", "id", map_int),
                ColumnMap("title", "title"),
                ColumnMap("description", "description"),
                ColumnMap("createdAt", "created_at", map_ts),
                ColumnMap("updatedAt", "updated_at", map_ts),
                ColumnMap("totalItems", "total_items", map_int),
                ColumnMap("processedItems", "processed_items", map_int),
                ColumnMap("progress", "progress"),
                ColumnMap("status", "status"),
                ColumnMap(None, "owner_user_id", const("28d38123-96e5-4ad9-b48b-734087d36bab")),
                ColumnMap(None, "group_ids", const([])),
                ColumnMap(None, "scope", const(None)),
                ColumnMap(None, "mode", const(None)),
                ColumnMap(None, "post_limit", const(None)),
                ColumnMap(None, "source", const("manual")),
                ColumnMap(None, "stats", const(None)),
                ColumnMap(None, "execution_run_id", const(None)),
                ColumnMap(None, "error", const(None)),
                ColumnMap(None, "skipped_groups_message", const(None)),
            ],
            conflict_target="id",
        ),
        TableMapping(
            legacy_table="task_audit_logs",
            target_table="task_audit_logs",
            columns=[
                ColumnMap("id", "id", map_int),
                ColumnMap("eventType", "event_type"),
                ColumnMap("eventData", "event_data", json_dumps),
                ColumnMap("createdAt", "created_at", map_ts),
                ColumnMap("taskId", "task_id", map_int),
                ColumnMap(None, "owner_user_id", const("28d38123-96e5-4ad9-b48b-734087d36bab")),
                ColumnMap(None, "aggregate_type", const("task")),
                ColumnMap(None, "aggregate_id", const(None)),
            ],
            conflict_target="id",
        ),
        TableMapping(
            legacy_table='"TaskAutomationSettings"',
            target_table="task_automation_settings",
            columns=[
                ColumnMap("id", "id", map_int),
                ColumnMap("createdAt", "created_at", map_ts),
                ColumnMap("updatedAt", "updated_at", map_ts),
                ColumnMap("enabled", "enabled", map_bool),
                ColumnMap("runHour", "run_hour", map_int),
                ColumnMap("runMinute", "run_minute", map_int),
                ColumnMap("postLimit", "post_limit", map_int),
                ColumnMap("lastRunAt", "last_run_at", map_ts),
                ColumnMap(None, "owner_user_id", const("28d38123-96e5-4ad9-b48b-734087d36bab")),
                ColumnMap(None, "timezone_offset_minutes", const(0)),
            ],
            conflict_target="id",
        ),
    ],
    "vk": [
        TableMapping(
            legacy_table='"Group"',
            target_table="vk_groups",
            columns=[
                ColumnMap("id", "id", map_int),
                ColumnMap("vkId", "vk_group_id", map_int),
                ColumnMap("screenName", "screen_name"),
                ColumnMap("name", "name"),
                ColumnMap("isClosed", "is_closed", map_bool),
                ColumnMap(None, "raw", raw_to_json),
                ColumnMap("createdAt", "first_seen_at", map_ts),
                ColumnMap("updatedAt", "last_seen_at", map_ts),
                ColumnMap(None, "deleted_at", const(None)),
            ],
            conflict_target="vk_group_id",
        ),
        TableMapping(
            legacy_table='"Author"',
            target_table="vk_authors",
            columns=[
                ColumnMap("id", "id", map_int),
                ColumnMap("vkUserId", "vk_author_id", map_int),
                ColumnMap(None, "type", const("user")),
                ColumnMap(
                    None,
                    "display_name",
                    lambda r: f"{r.get('firstName', '')} {r.get('lastName', '')}".strip()
                    if r else None,
                ),
                ColumnMap(None, "raw", raw_to_json),
                ColumnMap("createdAt", "first_seen_at", map_ts),
                ColumnMap("updatedAt", "last_seen_at", map_ts),
            ],
            conflict_target="vk_author_id",
        ),
    ],
    "content": [
        TableMapping(
            legacy_table='"Post"',
            target_table="content_posts",
            columns=[
                ColumnMap("id", "id", map_int),
                ColumnMap(None, "external_key",
                          lambda r: f"vk_{r.get('ownerId')}_{r.get('vkPostId')}" if r else None),
                ColumnMap("ownerId", "vk_owner_id", map_int),
                ColumnMap("vkPostId", "vk_post_id", map_int),
                ColumnMap("groupId", "vk_group_id", map_int),
                ColumnMap("fromId", "author_vk_id", map_int),
                ColumnMap("postedAt", "date", map_ts),
                ColumnMap("text", "text"),
                ColumnMap("commentsCount", "comments_count", map_int),
                ColumnMap(None, "last_collected_task_id", const(None)),
                ColumnMap("updatedAt", "updated_at", map_ts),
            ],
            conflict_target="external_key",
            order_by="id",
        ),
        TableMapping(
            legacy_table='"Comment"',
            target_table="content_comments",
            columns=[
                ColumnMap("id", "id", map_int),
                ColumnMap(None, "external_key",
                          lambda r: f"vk_{r.get('ownerId')}_{r.get('postId')}_{r.get('vkCommentId')}"
                          if r else None),
                ColumnMap("ownerId", "vk_owner_id", map_int),
                ColumnMap("postId", "vk_post_id", map_int),
                ColumnMap("vkCommentId", "vk_comment_id", map_int),
                ColumnMap("authorVkId", "author_vk_id", map_int),
                ColumnMap("publishedAt", "date", map_ts),
                ColumnMap("text", "text"),
                ColumnMap(None, "last_collected_task_id", const(None)),
                ColumnMap("updatedAt", "updated_at", map_ts),
                ColumnMap(None, "post_external_key",
                          lambda r: f"vk_{r.get('ownerId')}_{r.get('postId')}" if r else None),
            ],
            conflict_target="external_key",
            order_by="id",
        ),
        TableMapping(
            legacy_table='"MonitoringGroup"',
            target_table="monitoring_groups",
            columns=[
                ColumnMap("id", "id", map_int),
                ColumnMap("messenger", "messenger", str),
                ColumnMap("chatId", "chat_id"),
                ColumnMap("name", "name"),
                ColumnMap("category", "category"),
                ColumnMap("createdAt", "created_at", map_ts),
                ColumnMap("updatedAt", "updated_at", map_ts),
            ],
            conflict_target=["messenger", "chat_id"],
        ),
        TableMapping(
            legacy_table='"Group"',
            target_table="content_groups",
            columns=[
                ColumnMap("vkId", "vk_group_id", map_int),
                ColumnMap("screenName", "screen_name"),
                ColumnMap("name", "name"),
                ColumnMap("isClosed", "is_closed", map_bool),
                ColumnMap(None, "deactivated", const(None)),
                ColumnMap(None, "type", const(None)),
                ColumnMap(None, "description", const(None)),
                ColumnMap(None, "photo_50", const(None)),
                ColumnMap(None, "photo_100", const(None)),
                ColumnMap(None, "photo_200", const(None)),
                ColumnMap(None, "activity", const(None)),
                ColumnMap(None, "age_limits", const(None)),
                ColumnMap(None, "members_count", const(None)),
                ColumnMap(None, "status", const(None)),
                ColumnMap(None, "verified", const(None)),
                ColumnMap(None, "wall", const(None)),
                ColumnMap(None, "addresses", const(None)),
                ColumnMap(None, "city", const(None)),
                ColumnMap(None, "counters", const(None)),
                ColumnMap("updatedAt", "updated_at", map_ts),
            ],
            conflict_target="vk_group_id",
        ),
        TableMapping(
            legacy_table='"Author"',
            target_table="content_authors",
            columns=[
                ColumnMap("vkUserId", "vk_author_id", map_int),
                ColumnMap(None, "type", const("user")),
                ColumnMap(None, "display_name",
                          lambda r: f"{r.get('firstName', '')} {r.get('lastName', '')}".strip()
                          if r else None),
                ColumnMap("firstName", "first_name"),
                ColumnMap("lastName", "last_name"),
                ColumnMap("screenName", "screen_name"),
                ColumnMap("domain", "domain"),
                ColumnMap("city", "city", json_dumps),
                ColumnMap("country", "country", json_dumps),
                ColumnMap("photo50", "photo_50"),
                ColumnMap("photo100", "photo_100"),
                ColumnMap("photo200", "photo_200"),
                ColumnMap("followersCount", "followers_count", map_int),
                ColumnMap("verifiedAt", "verifiedAt", map_ts),
                ColumnMap("createdAt", "created_at", map_ts),
                ColumnMap("updatedAt", "updated_at", map_ts),
            ],
            conflict_target="vk_author_id",
        ),
    ],
    "moderation": [
        TableMapping(
            legacy_table='"Keyword"',
            target_table="keywords",
            columns=[
                ColumnMap("id", "id", map_int),
                ColumnMap("word", "word"),
                ColumnMap("category", "category"),
                ColumnMap("isPhrase", "is_phrase", map_bool),
                ColumnMap("createdAt", "created_at", map_ts),
                ColumnMap("updatedAt", "updated_at", map_ts),
            ],
            conflict_target="word",
        ),
        TableMapping(
            legacy_table='"KeywordForm"',
            target_table="keyword_forms",
            columns=[
                ColumnMap("id", "id", map_int),
                ColumnMap("keywordId", "keyword_id", map_int),
                ColumnMap("form", "form"),
                ColumnMap("source", "source", str),
                ColumnMap("createdAt", "created_at", map_ts),
            ],
            conflict_target=["keyword_id", "form", "source"],
        ),
        TableMapping(
            legacy_table='"KeywordFormExclusion"',
            target_table="keyword_form_exclusions",
            columns=[
                ColumnMap("id", "id", map_int),
                ColumnMap("keywordId", "keyword_id", map_int),
                ColumnMap("form", "form"),
                ColumnMap("createdAt", "created_at", map_ts),
            ],
            conflict_target=["keyword_id", "form"],
        ),
        TableMapping(
            legacy_table='"PhotoAnalysis"',
            target_table="photo_analyses",
            columns=[
                ColumnMap("id", "id", map_int),
                ColumnMap("authorId", "author_vk_id", map_int),
                ColumnMap("photoUrl", "photo_url"),
                ColumnMap("photoVkId", "photo_vk_id"),
                ColumnMap("analysisResult", "analysis_result", json_dumps),
                ColumnMap("hasSuspicious", "has_suspicious", map_bool),
                ColumnMap("suspicionLevel", "suspicion_level", str),
                ColumnMap("categories", "categories", json_dumps),
                ColumnMap("confidence", "confidence", float),
                ColumnMap("explanation", "explanation"),
                ColumnMap("analyzedAt", "analyzed_at", map_ts),
                ColumnMap("createdAt", "created_at", map_ts),
                ColumnMap("updatedAt", "updated_at", map_ts),
            ],
            conflict_target=["author_vk_id", "photo_vk_id"],
        ),
        TableMapping(
            legacy_table='"WatchlistAuthor"',
            target_table="watchlist_authors",
            columns=[
                ColumnMap("id", "id", map_int),
                ColumnMap("authorVkId", "author_vk_id", map_int),
                ColumnMap("sourceCommentId", "source_comment_id", map_int),
                ColumnMap("status", "status", str),
                ColumnMap("lastCheckedAt", "last_checked_at", map_ts),
                ColumnMap("lastActivityAt", "last_activity_at", map_ts),
                ColumnMap("foundCommentsCount", "found_comments_count", map_int),
                ColumnMap("monitoringStartedAt", "monitoring_started_at", map_ts),
                ColumnMap("monitoringStoppedAt", "monitoring_stopped_at", map_ts),
                ColumnMap("settingsId", "settings_id", map_int),
                ColumnMap("createdAt", "created_at", map_ts),
                ColumnMap("updatedAt", "updated_at", map_ts),
            ],
            conflict_target=["author_vk_id", "settings_id"],
        ),
        TableMapping(
            legacy_table='"WatchlistSettings"',
            target_table="watchlist_settings",
            columns=[
                ColumnMap("id", "id", map_int),
                ColumnMap("trackAllComments", "track_all_comments", map_bool),
                ColumnMap("pollIntervalMinutes", "poll_interval_minutes", map_int),
                ColumnMap("maxAuthors", "max_authors", map_int),
                ColumnMap("createdAt", "created_at", map_ts),
                ColumnMap("updatedAt", "updated_at", map_ts),
            ],
            conflict_target="id",
        ),
        TableMapping(
            legacy_table='"Comment"',
            target_table="moderation_comments",
            columns=[
                ColumnMap(None, "external_key",
                          lambda r: f"vk_{r.get('ownerId')}_{r.get('postId')}_{r.get('vkCommentId')}"
                          if r else None),
                ColumnMap(None, "post_external_key",
                          lambda r: f"vk_{r.get('ownerId')}_{r.get('postId')}" if r else None),
                ColumnMap("text", "text"),
                ColumnMap("publishedAt", "date", map_ts),
                ColumnMap("authorVkId", "author_vk_id", map_int),
                ColumnMap(None, "is_read", const(False)),
                ColumnMap(None, "source", const("TASK")),
                ColumnMap(None, "matched_keywords", const("[]")),
                ColumnMap(None, "watchlist_author_id", const(None)),
                ColumnMap("updatedAt", "updated_at", map_ts),
                ColumnMap("ownerId", "_", select_only=True),
                ColumnMap("postId", "_", select_only=True),
                ColumnMap("vkCommentId", "_", select_only=True),
            ],
            conflict_target="external_key",
            order_by="id",
        ),
    ],
    "telegram": [
        TableMapping(
            legacy_table='"TelegramUser"',
            target_table='user',
            columns=[
                ColumnMap("id", "id", map_int),
                ColumnMap("telegramId", "user_id", map_int),
                ColumnMap("firstName", "first_name"),
                ColumnMap("lastName", "last_name"),
                ColumnMap("username", "username"),
                ColumnMap("isBot", "bot", map_bool),
                ColumnMap("isPremium", "premium", map_bool),
                ColumnMap("scam", "scam", map_bool),
                ColumnMap("phoneNumber", "phone"),
                ColumnMap("createdAt", "upd_date", map_ts),
            ],
            conflict_target="user_id",
        ),
    ],
    "listings": [
        TableMapping(
            legacy_table='"Listing"',
            target_table="listings",
            columns=[
                ColumnMap("id", "id", map_int),
                ColumnMap("source", "source"),
                ColumnMap("externalId", "external_id"),
                ColumnMap("title", "title"),
                ColumnMap("description", "description"),
                ColumnMap("url", "url"),
                ColumnMap("price", "price", map_int),
                ColumnMap("currency", "currency"),
                ColumnMap("address", "address"),
                ColumnMap("city", "city"),
                ColumnMap("latitude", "latitude"),
                ColumnMap("longitude", "longitude"),
                ColumnMap("rooms", "rooms", map_int),
                ColumnMap("areaTotal", "area_total"),
                ColumnMap("areaLiving", "area_living"),
                ColumnMap("areaKitchen", "area_kitchen"),
                ColumnMap("floor", "floor", map_int),
                ColumnMap("floorsTotal", "floors_total", map_int),
                ColumnMap("publishedAt", "published_at", map_ts),
                ColumnMap("contactName", "contact_name"),
                ColumnMap("contactPhone", "contact_phone"),
                ColumnMap("images", "images"),
                ColumnMap("sourceAuthorName", "source_author_name"),
                ColumnMap("sourceAuthorPhone", "source_author_phone"),
                ColumnMap("sourceAuthorUrl", "source_author_url"),
                ColumnMap("sourcePostedAt", "source_posted_at"),
                ColumnMap("sourceParsedAt", "source_parsed_at", map_ts),
                ColumnMap("manualOverrides", "manual_overrides", json_dumps),
                ColumnMap("manualNote", "manual_note"),
                ColumnMap("archived", "archived", map_bool),
                ColumnMap("createdAt", "created_at", map_ts),
                ColumnMap("updatedAt", "updated_at", map_ts),
            ],
            conflict_target="url",
        ),
    ],
    "im": [
        TableMapping(
            legacy_table='"MonitoringGroup"',
            target_table="im_groups",
            columns=[
                ColumnMap("messenger", "messenger", str),
                ColumnMap("chatId", "external_chat_id"),
                ColumnMap("name", "name"),
                ColumnMap("category", "category"),
                ColumnMap(None, "raw", raw_to_json),
                ColumnMap("createdAt", "first_seen_at", map_ts),
                ColumnMap("updatedAt", "last_seen_at", map_ts),
            ],
            conflict_target=["messenger", "external_chat_id"],
            filter_where="messenger IN ('whatsapp', 'max')",
        ),
    ],
}

# ---------------------------------------------------------------------------
# Core upsert logic
# ---------------------------------------------------------------------------


class UpsertEngine:
    def __init__(
        self,
        staging_dsn: str,
        target_dsn: str,
        dry_run: bool = False,
    ):
        self.staging_dsn = staging_dsn
        self.target_dsn = target_dsn
        self.dry_run = dry_run
        self.staging: asyncpg.Connection | None = None
        self.target: asyncpg.Connection | None = None

    async def connect(self):
        self.staging = await asyncpg.connect(self.staging_dsn)
        self.target = await asyncpg.connect(self.target_dsn)
        logger.info("Connected to staging and target databases")

    async def close(self):
        for conn in (self.staging, self.target):
            if conn and not conn.is_closed():
                await conn.close()

    async def _get_type_map(self) -> dict:
        """Build name -> oid map for legacy enums that survive as text in target."""
        if not self.staging:
            return {}
        rows = await self.staging.fetch(
            "SELECT oid, typname FROM pg_type WHERE typcategory = 'E'"
        )
        return {row["typname"]: row["oid"] for row in rows}

    async def migrate_table(self, mapping: TableMapping) -> dict:
        """Migrate one legacy table to target using the defined mapping.

        Returns stats dict.
        """
        stats: dict = {
            "table": f"{mapping.legacy_table} -> {mapping.target_table}",
            "total": 0,
            "inserted": 0,
            "updated": 0,
            "errors": 0,
        }

        # Build column names for SELECT
        legacy_cols = []
        col_map = {}
        for cm in mapping.columns:
            if cm.legacy is not None:
                legacy_cols.append(cm.legacy)
            col_map[cm.target] = cm

        legacy_col_list = ", ".join(f"\"{c}\"" for c in legacy_cols)

        # Build query
        query = f"SELECT {legacy_col_list} FROM {mapping.legacy_table}"
        if mapping.filter_where:
            query += f" WHERE {mapping.filter_where}"
        if mapping.order_by:
            query += f" ORDER BY \"{mapping.order_by}\""

        # Count total
        count_query = f"SELECT count(*) FROM {mapping.legacy_table}"
        if mapping.filter_where:
            count_query += f" WHERE {mapping.filter_where}"
        total = await self.staging.fetchval(count_query)
        stats["total"] = total

        if total == 0:
            logger.info("  %s: 0 rows, skipping", mapping.legacy_table)
            return stats

        logger.info(
            "  %s: %d rows to migrate",
            mapping.legacy_table, total,
        )

        # Target column list for INSERT (exclude select_only columns)
        target_cols = [cm.target for cm in mapping.columns if not cm.select_only]

        # Build conflict clause
        if isinstance(mapping.conflict_target, list):
            conflict_cols = ", ".join(f"\"{c}\"" for c in mapping.conflict_target)
        else:
            conflict_cols = f"\"{mapping.conflict_target}\""

        # Build UPDATE set clause (exclude conflict columns)
        update_cols = [c for c in target_cols
                       if c not in (
                           mapping.conflict_target
                           if isinstance(mapping.conflict_target, list)
                           else [mapping.conflict_target]
                       )]
        update_set = ", ".join(
            f"\"{c}\" = EXCLUDED.\"{c}\"" for c in update_cols
        )

        insert_cols = ", ".join(f"\"{c}\"" for c in target_cols)
        insert_placeholders = ", ".join(f"${i+1}" for i in range(len(target_cols)))

        if mapping.conflict_action == "nothing":
            upsert_sql = (
                f'INSERT INTO "{mapping.target_table}" ({insert_cols}) '
                f"VALUES ({insert_placeholders}) "
                f'ON CONFLICT ({conflict_cols}) DO NOTHING'
            )
        else:
            upsert_sql = (
                f'INSERT INTO "{mapping.target_table}" ({insert_cols}) '
                f"VALUES ({insert_placeholders}) "
                f'ON CONFLICT ({conflict_cols}) DO UPDATE SET {update_set}'
            )

        # Process in batches
        offset = 0
        batch_size = mapping.batch_size

        while offset < total:
            batch_sql = query
            if mapping.order_by:
                batch_sql += f" LIMIT {batch_size}"
            else:
                batch_sql += f" LIMIT {batch_size}"
            batch_sql += f" OFFSET {offset}"

            try:
                rows = await self.staging.fetch(batch_sql)

                for row in rows:
                    # Build values dict
                    row_dict = dict(row)
                    values = {}
                    for cm in mapping.columns:
                        val = row_dict.get(cm.legacy) if cm.legacy else None
                        if cm.transform:
                            try:
                                val = cm.transform(row_dict if cm.legacy is None else val)
                            except Exception as e:
                                logger.warning(
                                    "  Transform error on %s.%s: %s",
                                    mapping.legacy_table, cm.target, e,
                                )
                                val = None
                        values[cm.target] = val

                    vals_list = [values[c] for c in target_cols]

                    if self.dry_run:
                        stats["inserted"] += 1
                        continue

                    result = await self.target.execute(upsert_sql, *vals_list)
                    if "INSERT" in result:
                        stats["inserted"] += 1
                    else:
                        stats["updated"] += 1

            except Exception as e:
                logger.error("  Error at offset %d: %s", offset, e)
                stats["errors"] += 1

            offset += batch_size

            if offset % (batch_size * 10) == 0 or offset >= total:
                pct = min(100, int(offset / total * 100)) if total else 100
                logger.info("    progress: %d/%d (%d%%)", offset, total, pct)

        logger.info(
            "  Done: %d inserted, %d updated, %d errors",
            stats["inserted"], stats["updated"], stats["errors"],
        )
        return stats

    async def _migrate_telegram_chats(self) -> dict:
        """Migrate TelegramChat routing by type to group/supergroup/channel tables."""
        stats: dict = {"telegram_chats": {"total": 0, "inserted": 0, "errors": 0}}
        try:
            rows = await self.staging.fetch(
                'SELECT * FROM "TelegramChat" ORDER BY id'
            )
            stats["telegram_chats"]["total"] = len(rows)

            for row in rows:
                row_dict = dict(row)
                chat_type = str(row_dict.get("type", "")).upper()
                telegram_id = row_dict.get("telegramId")
                title = row_dict.get("title", "")
                username = row_dict.get("username")
                description_val = row_dict.get("description")
                created_at = map_ts(row_dict.get("createdAt"))
                updated_at = map_ts(row_dict.get("updatedAt"))

                if chat_type == "CHANNEL":
                    sql = """INSERT INTO "channel" (channel_id, title, date, username, description, upd_date, scam, region)
                             VALUES ($1, $2, $3, $4, $5, $6, false, 0)
                             ON CONFLICT (channel_id) DO UPDATE SET
                                title = EXCLUDED.title, username = EXCLUDED.username,
                                description = EXCLUDED.description, upd_date = EXCLUDED.upd_date"""
                    await self.target.execute(sql, telegram_id, title, created_at, username, description_val, updated_at)
                elif chat_type == "SUPERGROUP":
                    sql = """INSERT INTO "supergroup" (supergroup_id, title, date, username, description, upd_date, scam, region)
                             VALUES ($1, $2, $3, $4, $5, $6, 0, 0)
                             ON CONFLICT (supergroup_id) DO UPDATE SET
                                title = EXCLUDED.title, username = EXCLUDED.username,
                                description = EXCLUDED.description, upd_date = EXCLUDED.upd_date"""
                    await self.target.execute(sql, telegram_id, title, created_at, username, description_val, updated_at)
                elif chat_type == "GROUP":
                    sql = """INSERT INTO "group" (group_id, title, date, description, upd_date, region)
                             VALUES ($1, $2, $3, $4, $5, 0)
                             ON CONFLICT (group_id) DO UPDATE SET
                                title = EXCLUDED.title, description = EXCLUDED.description, upd_date = EXCLUDED.upd_date"""
                    await self.target.execute(sql, telegram_id, title, created_at, description_val, updated_at)
                else:
                    logger.warning("  Unknown TelegramChat type: %s", chat_type)
                    stats["telegram_chats"]["errors"] += 1
                    continue

                stats["telegram_chats"]["inserted"] += 1

            logger.info(
                "  TelegramChat -> routed: %d inserted, %d errors",
                stats["telegram_chats"]["inserted"],
                stats["telegram_chats"]["errors"],
            )
        except Exception as e:
            logger.error("  TelegramChat migration error: %s", e)
            stats["telegram_chats"]["errors"] = stats["telegram_chats"]["total"]
        return stats

    async def run_service(self, service: str) -> dict:
        """Run all migrations for one service."""
        mappings = SERVICE_MIGRATIONS.get(service)
        if not mappings:
            logger.warning("Unknown service: %s", service)
            return {}

        logger.info("=== Migrating %s ===", service)
        results = {}
        for mapping in mappings:
            result = await self.migrate_table(mapping)
            results[mapping.legacy_table] = result

        if service == "telegram":
            chat_results = await self._migrate_telegram_chats()
            results.update(chat_results)

        return results


async def main():
    parser = argparse.ArgumentParser(description="Migrate data from staging to microservice DBs")
    parser.add_argument("--service", default="all",
                        help="Service to migrate (identity|tasks|vk|content|moderation|telegram|listings|all)")
    parser.add_argument("--staging-dsn", default=STAGING_DSN,
                        help=f"Staging DB DSN (default: {STAGING_DSN})")
    parser.add_argument("--target-dsn", default=None,
                        help="Target DB DSN (overrides auto-detection)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Preview without making changes")
    parser.add_argument("--verbose", "-v", action="store_true",
                        help="Verbose DEBUG logging")
    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    services = SERVICE_MIGRATIONS.keys() if args.service == "all" else [args.service]

    if args.dry_run:
        logger.info("DRY RUN MODE — no data will be modified")

    for svc in services:
        target_dsn = args.target_dsn or _default_target_dsn(svc)
        engine = UpsertEngine(
            staging_dsn=args.staging_dsn,
            target_dsn=target_dsn,
            dry_run=args.dry_run,
        )
        try:
            await engine.connect()
            results = await engine.run_service(svc)
            # Print summary
            for table, stats in results.items():
                if "table" in stats:
                    status_text = "OK" if stats["errors"] == 0 else f"ERRORS: {stats['errors']}"
                    logger.info(
                        "  %s: %d/%d/%d [%s]",
                        stats["table"],
                        stats["inserted"], stats["updated"], stats["total"],
                        status_text,
                    )
                else:
                    status_text = "OK" if stats.get("errors", 0) == 0 else f"ERRORS: {stats.get('errors', 0)}"
                    logger.info(
                        "  %s: %d/0/%d [%s]",
                        table,
                        stats.get("inserted", 0), stats.get("total", 0),
                        status_text,
                    )
        finally:
            await engine.close()

    logger.info("All done!")


if __name__ == "__main__":
    asyncio.run(main())
