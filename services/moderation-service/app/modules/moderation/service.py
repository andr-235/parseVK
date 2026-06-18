from app.modules.moderation.crud_service import ModerationCrudService
from app.modules.moderation.schemas import VkEvent
from sqlalchemy.ext.asyncio import AsyncSession


class ModerationService:
    def __init__(self, session: AsyncSession):
        self.session = session
        svc = self
        self.crud = ModerationCrudService(
            session,
            on_enrich=lambda records: svc._enrich_comments(records),
        )

    def _enrich_comments(self, records):
        return records

    def _build_base_filters(self, search, keywords):
        return self.crud._build_base_filters(search, keywords)

    async def get_comments(
        self,
        page: int,
        limit: int,
        read_status: str | None = None,
        search: str | None = None,
        keywords: list[str] | None = None,
        keyword_source: str | None = None,
    ):
        return await self.crud.get_comments(
            page, limit, read_status, search, keywords, keyword_source
        )

    async def get_comments_cursor(
        self,
        cursor: str | None,
        limit: int,
        read_status: str | None = None,
        search: str | None = None,
        keywords: list[str] | None = None,
        keyword_source: str | None = None,
    ):
        return await self.crud.get_comments_cursor(
            cursor, limit, read_status, search, keywords, keyword_source
        )

    async def update_read_status(self, id: int, is_read: bool):
        return await self.crud.update_read_status(id, is_read)

    async def handle_event(self, event: VkEvent) -> bool:
        if await self.crud.is_processed(event.event_id):
            return False
        if event.event_type == "vk.comment_collected":
            await self.crud.upsert_comment(event.payload["comment"])
        await self.crud.mark_processed(event.event_id, event.event_type)
        await self.session.commit()
        return True
