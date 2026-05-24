from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select, update
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

    async def get_comments(self, page: int, limit: int, read_status: str | None = None, search: str | None = None):
        offset = (page - 1) * limit
        stmt = select(ModerationComment)
        if read_status == "read":
            stmt = stmt.where(ModerationComment.is_read == True)
        elif read_status == "unread":
            stmt = stmt.where(ModerationComment.is_read == False)
            
        if search:
            stmt = stmt.where(ModerationComment.text.ilike(f"%{search}%"))
            
        stmt = stmt.order_by(ModerationComment.date.desc().nulls_last(), ModerationComment.id.desc())
        stmt = stmt.offset(offset).limit(limit)
        
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_comments_cursor(self, cursor: str | None, limit: int, read_status: str | None = None, search: str | None = None):
        stmt = select(ModerationComment)
        if read_status == "read":
            stmt = stmt.where(ModerationComment.is_read == True)
        elif read_status == "unread":
            stmt = stmt.where(ModerationComment.is_read == False)
            
        if search:
            stmt = stmt.where(ModerationComment.text.ilike(f"%{search}%"))
            
        if cursor:
            # Simple cursor parsing (date_timestamp_id)
            try:
                parts = cursor.split("_")
                if len(parts) == 2:
                    cursor_date = datetime.fromtimestamp(float(parts[0]), timezone.utc)
                    cursor_id = int(parts[1])
                    stmt = stmt.where(
                        (ModerationComment.date < cursor_date) |
                        ((ModerationComment.date == cursor_date) & (ModerationComment.id < cursor_id))
                    )
            except (ValueError, IndexError):
                pass
                
        stmt = stmt.order_by(ModerationComment.date.desc().nulls_last(), ModerationComment.id.desc())
        stmt = stmt.limit(limit)
        
        result = await self.session.execute(stmt)
        items = result.scalars().all()
        
        next_cursor = None
        if items:
            last = items[-1]
            if last.date:
                next_cursor = f"{last.date.timestamp()}_{last.id}"
                
        return {"items": items, "next_cursor": next_cursor}

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
        owner_id = int(comment["owner_id"])
        post_id = int(comment["post_id"])
        comment_id = int(comment["id"])
        
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
