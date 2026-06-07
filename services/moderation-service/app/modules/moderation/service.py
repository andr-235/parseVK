from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select, update, or_, case, func
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ModerationComment, ProcessedEvent
from app.modules.moderation.schemas import VkEvent

CONSUMER_NAME = "moderation-service.vk"


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def vk_timestamp(value: int | None) -> datetime | None:
    if value is None:
        return None
    return datetime.fromtimestamp(int(value), timezone.utc)


class ModerationService:
    def __init__(self, session: AsyncSession):
        self.session = session

    def _build_base_filters(self, search: str | None, keywords: list[str] | None):
        conditions = []
        if search:
            conditions.append(ModerationComment.text.ilike(f"%{search}%"))
        if keywords:
            kw_conds = []
            for kw in keywords:
                kw_cleaned = kw.strip()
                if kw_cleaned:
                    # SQLite & Postgres-compatible JSON array contains check
                    kw_conds.append(ModerationComment.matched_keywords.contains(kw_cleaned))
            if kw_conds:
                conditions.append(or_(*kw_conds))
        return conditions

    async def get_comments(
        self,
        page: int,
        limit: int,
        read_status: str | None = None,
        search: str | None = None,
        keywords: list[str] | None = None,
        keyword_source: str | None = None
    ):
        offset = (page - 1) * limit
        base_conditions = self._build_base_filters(search, keywords)
        
        # 1. Calculate stats (read_count, unread_count) using base conditions only
        stats_stmt = select(
            func.sum(case((ModerationComment.is_read == True, 1), else_=0)).label("read_count"),
            func.sum(case((ModerationComment.is_read == False, 1), else_=0)).label("unread_count")
        )
        for cond in base_conditions:
            stats_stmt = stats_stmt.where(cond)
            
        stats_res = await self.session.execute(stats_stmt)
        stats_row = stats_res.one()
        read_count = int(stats_row.read_count or 0)
        unread_count = int(stats_row.unread_count or 0)
        
        # total based on read_status filter
        if read_status == "read":
            total = read_count
        elif read_status == "unread":
            total = unread_count
        else:
            total = read_count + unread_count
            
        # 2. Select limit + 1 items to determine has_more
        stmt = select(ModerationComment)
        for cond in base_conditions:
            stmt = stmt.where(cond)
            
        if read_status == "read":
            stmt = stmt.where(ModerationComment.is_read == True)
        elif read_status == "unread":
            stmt = stmt.where(ModerationComment.is_read == False)
            
        stmt = stmt.order_by(ModerationComment.date.desc().nulls_last(), ModerationComment.id.desc())
        stmt = stmt.offset(offset).limit(limit + 1)
        
        result = await self.session.execute(stmt)
        raw_items = result.scalars().all()
        
        has_more = len(raw_items) > limit
        items = raw_items[:limit]
        
        return {
            "items": items,
            "total": total,
            "has_more": has_more,
            "read_count": read_count,
            "unread_count": unread_count
        }

    async def get_comments_cursor(
        self,
        cursor: str | None,
        limit: int,
        read_status: str | None = None,
        search: str | None = None,
        keywords: list[str] | None = None,
        keyword_source: str | None = None
    ):
        base_conditions = self._build_base_filters(search, keywords)
        
        # 1. Calculate stats (read_count, unread_count) using base conditions only
        stats_stmt = select(
            func.sum(case((ModerationComment.is_read == True, 1), else_=0)).label("read_count"),
            func.sum(case((ModerationComment.is_read == False, 1), else_=0)).label("unread_count")
        )
        for cond in base_conditions:
            stats_stmt = stats_stmt.where(cond)
            
        stats_res = await self.session.execute(stats_stmt)
        stats_row = stats_res.one()
        read_count = int(stats_row.read_count or 0)
        unread_count = int(stats_row.unread_count or 0)
        
        if read_status == "read":
            total = read_count
        elif read_status == "unread":
            total = unread_count
        else:
            total = read_count + unread_count
            
        # 2. Select limit + 1 items with cursor logic to determine has_more
        stmt = select(ModerationComment)
        for cond in base_conditions:
            stmt = stmt.where(cond)
            
        if read_status == "read":
            stmt = stmt.where(ModerationComment.is_read == True)
        elif read_status == "unread":
            stmt = stmt.where(ModerationComment.is_read == False)
            
        if cursor:
            try:
                parts = cursor.split("_")
                if len(parts) == 2 and parts[0] == "null":
                    cursor_id = int(parts[1])
                    stmt = stmt.where(
                        ModerationComment.date.is_(None) & (ModerationComment.id < cursor_id)
                    )
                elif len(parts) == 2:
                    cursor_date = datetime.fromtimestamp(float(parts[0]), timezone.utc)
                    cursor_id = int(parts[1])
                    stmt = stmt.where(
                        (ModerationComment.date < cursor_date)
                        | (
                            (ModerationComment.date == cursor_date)
                            & (ModerationComment.id < cursor_id)
                        )
                        | ModerationComment.date.is_(None)
                    )
            except (ValueError, IndexError):
                pass
                
        stmt = stmt.order_by(ModerationComment.date.desc().nulls_last(), ModerationComment.id.desc())
        stmt = stmt.limit(limit + 1)
        
        result = await self.session.execute(stmt)
        raw_items = result.scalars().all()
        
        has_more = len(raw_items) > limit
        items = raw_items[:limit]
        
        next_cursor = None
        if items and has_more:
            last = items[-1]
            if last.date:
                next_cursor = f"{last.date.timestamp()}_{last.id}"
            else:
                next_cursor = f"null_{last.id}"
                
        return {
            "items": items,
            "next_cursor": next_cursor,
            "has_more": has_more,
            "total": total,
            "read_count": read_count,
            "unread_count": unread_count
        }

    async def update_read_status(self, id: int, is_read: bool) -> ModerationComment | None:
        stmt = update(ModerationComment).where(ModerationComment.id == id).values(
            is_read=is_read, updated_at=utcnow()
        ).returning(ModerationComment)
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.scalar_one_or_none()

    # --- Kafka Processing ---
    
    async def is_processed(self, event_id: UUID) -> bool:
        return (
            await self.session.scalar(
                select(ProcessedEvent.id).where(
                    ProcessedEvent.consumer_name == CONSUMER_NAME,
                    ProcessedEvent.event_id == event_id,
                )
            )
            is not None
        )

    async def mark_processed(self, event_id: UUID, event_type: str) -> None:
        self.session.add(ProcessedEvent(consumer_name=CONSUMER_NAME, event_id=event_id, event_type=event_type))

    async def upsert_comment(self, comment: dict) -> None:
        now = utcnow()
        owner_id = int(comment.get("owner_id", 0))
        post_id = int(comment.get("post_id", 0))
        comment_id = int(comment.get("id", 0))
        
        stmt = insert(ModerationComment).values(
            external_key=f"{owner_id}:{post_id}:{comment_id}",
            post_external_key=f"{owner_id}:{post_id}",
            author_vk_id=comment.get("from_id"),
            date=vk_timestamp(comment.get("date")),
            text=comment.get("text"),
            is_read=False,
            source="TASK",  # default
            matched_keywords=[],
            updated_at=now,
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=[ModerationComment.external_key],
            set_={
                "author_vk_id": stmt.excluded.author_vk_id,
                "date": stmt.excluded.date,
                "text": stmt.excluded.text,
                "updated_at": now,
            },
        )
        await self.session.execute(stmt)

    async def handle_event(self, event: VkEvent) -> bool:
        if await self.is_processed(event.event_id):
            return False
            
        if event.event_type == "vk.comment_collected":
            comment = event.payload["comment"]
            await self.upsert_comment(comment)
            
        await self.mark_processed(event.event_id, event.event_type)
        await self.session.commit()
        return True
