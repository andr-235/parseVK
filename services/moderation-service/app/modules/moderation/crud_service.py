import logging
from collections.abc import Callable
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from app.db.models import ModerationComment, ProcessedEvent
from sqlalchemy import and_, case, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

CONSUMER_NAME = "moderation-service"

logger = logging.getLogger("moderation-service.moderation.crud")


class ModerationCrudService:
    def __init__(self, session: AsyncSession, on_enrich: Callable):
        self.session = session
        self.on_enrich = on_enrich

    def _build_base_filters(
        self,
        search: str | None = None,
        keywords: list[str] | None = None,
    ) -> list[Any]:
        filters: list[Any] = []
        if search:
            filters.append(ModerationComment.text.ilike(f"%{search}%"))
        if keywords:
            keyword_filters = [
                ModerationComment.matched_keywords.contains(kw) for kw in keywords
            ]
            filters.append(or_(*keyword_filters))
        return filters

    async def get_comments(
        self,
        page: int = 1,
        limit: int = 50,
        read_status: str | None = None,
        search: str | None = None,
        keywords: list[str] | None = None,
        keyword_source: str | None = None,
    ) -> dict[str, Any]:
        logger.debug(
            "ModerationCrudService.get_comments: page=%d, limit=%d, read_status=%s",
            page, limit, read_status,
        )
        base_filters = self._build_base_filters(search, keywords)
        if read_status == "read":
            base_filters.append(ModerationComment.is_read.is_(True))
        elif read_status == "unread":
            base_filters.append(ModerationComment.is_read.is_(False))

        stats_row = (
            await self.session.execute(
                select(
                    func.coalesce(
                        func.sum(case((ModerationComment.is_read, 1), else_=0)), 0,
                    ).label("read_count"),
                    func.coalesce(
                        func.sum(case((~ModerationComment.is_read, 1), else_=0)), 0,
                    ).label("unread_count"),
                ).where(and_(*base_filters))
            )
        ).one()
        read_count = stats_row.read_count
        unread_count = stats_row.unread_count

        data_query = (
            select(ModerationComment)
            .where(and_(*base_filters))
            .order_by(ModerationComment.date.desc(), ModerationComment.id.desc())
            .limit(limit + 1)
        )
        result = await self.session.execute(data_query)
        all_items = list(result.scalars().all())

        has_more = len(all_items) > limit
        items = all_items[:limit]
        total = (page - 1) * limit + len(all_items)

        return {
            "items": items,
            "total": total,
            "has_more": has_more,
            "read_count": read_count,
            "unread_count": unread_count,
        }

    async def get_comments_cursor(
        self,
        cursor: str | None = None,
        limit: int = 50,
        read_status: str | None = None,
        search: str | None = None,
        keywords: list[str] | None = None,
        keyword_source: str | None = None,
    ) -> dict[str, Any]:
        logger.debug(
            "ModerationCrudService.get_comments_cursor: cursor=%s, limit=%d",
            cursor, limit,
        )
        base_filters = self._build_base_filters(search, keywords)
        if read_status == "read":
            base_filters.append(ModerationComment.is_read.is_(True))
        elif read_status == "unread":
            base_filters.append(ModerationComment.is_read.is_(False))

        stats_row = (
            await self.session.execute(
                select(
                    func.coalesce(
                        func.sum(case((ModerationComment.is_read, 1), else_=0)), 0,
                    ).label("read_count"),
                    func.coalesce(
                        func.sum(case((~ModerationComment.is_read, 1), else_=0)), 0,
                    ).label("unread_count"),
                ).where(and_(*base_filters))
            )
        ).one()
        read_count = stats_row.read_count
        unread_count = stats_row.unread_count

        if cursor:
            cursor_parts = cursor.split("_", 1)
            if cursor_parts[0] == "null":
                cursor_id = int(cursor_parts[1])
                base_filters.append(ModerationComment.id < cursor_id)
            else:
                cursor_date = datetime.fromisoformat(cursor_parts[0])
                cursor_id = int(cursor_parts[1])
                base_filters.append(
                    or_(
                        ModerationComment.date < cursor_date,
                        and_(ModerationComment.date == cursor_date, ModerationComment.id < cursor_id),
                    )
                )

        query = (
            select(ModerationComment)
            .where(and_(*base_filters))
            .order_by(ModerationComment.date.desc(), ModerationComment.id.desc())
            .limit(limit + 1)
        )
        result = await self.session.execute(query)
        all_items = list(result.scalars().all())

        has_more = len(all_items) > limit
        items = all_items[:limit]

        next_cursor: str | None = None
        if items:
            last = items[-1]
            if last.date is None:
                next_cursor = f"null_{last.id}"
            else:
                next_cursor = f"{last.date.isoformat()}_{last.id}"

        return {
            "items": items,
            "next_cursor": next_cursor,
            "has_more": has_more,
            "total": len(all_items),
            "read_count": read_count,
            "unread_count": unread_count,
        }

    async def update_read_status(self, id: int, is_read: bool) -> dict[str, Any]:
        logger.debug("ModerationCrudService.update_read_status: id=%d, is_read=%s", id, is_read)
        stmt = (
            update(ModerationComment)
            .where(ModerationComment.id == id)
            .values(is_read=is_read, updated_at=datetime.now(UTC))
        )
        await self.session.execute(stmt)
        return {"id": id, "is_read": is_read}

    async def is_processed(self, event_id: UUID) -> bool:
        logger.debug("ModerationCrudService.is_processed: event_id=%s", event_id)
        stmt = select(ProcessedEvent).where(
            and_(
                ProcessedEvent.consumer_name == CONSUMER_NAME,
                ProcessedEvent.event_id == event_id,
            )
        )
        result = await self.session.scalar(stmt)
        return result is not None

    async def upsert_comment(self, comment_data: dict) -> ModerationComment:
        logger.debug("ModerationCrudService.upsert_comment")
        stmt = (
            select(ModerationComment)
            .where(ModerationComment.external_key == comment_data["external_key"])
        )
        result = await self.session.execute(stmt)
        existing = result.scalar_one_or_none()
        now = datetime.now(UTC)

        if existing:
            for key, value in comment_data.items():
                if hasattr(existing, key):
                    setattr(existing, key, value)
            existing.updated_at = now
            logger.info("ModerationCrudService.upsert_comment: updated comment %d", existing.id)
            return existing
        else:
            comment = ModerationComment(**comment_data, updated_at=now)
            self.session.add(comment)
            await self.session.flush()
            logger.info("ModerationCrudService.upsert_comment: created comment %d", comment.id)
            return comment

    async def mark_processed(self, event_id: UUID, event_type: str) -> None:
        logger.debug("ModerationCrudService.mark_processed: event_id=%s, type=%s", event_id, event_type)
        event = ProcessedEvent(
            consumer_name=CONSUMER_NAME,
            event_id=event_id,
            event_type=event_type,
            processed_at=datetime.now(UTC),
        )
        self.session.add(event)
