import asyncio
import logging
from datetime import UTC, datetime

from app.db.models import KeywordRecalculationJob
from app.modules.keywords.matcher import KeywordMatcher
from app.modules.keywords.recalculation import RecalculationWorker
from app.modules.keywords.repository import KeywordMatchRepository
from app.modules.moderation.comment_event_mapper import (
    InvalidVkCommentEvent,
    map_vk_comment_event,
)
from app.modules.moderation.crud_service import ModerationCrudService
from common.events import VkEvent
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

logger = logging.getLogger(__name__)


class ModerationService:
    def __init__(self, session: AsyncSession, session_maker: async_sessionmaker | None = None):
        self.session = session
        self.session_maker = session_maker
        svc = self
        self.crud = ModerationCrudService(
            session,
            on_enrich=lambda records: svc._enrich_comments(records),
        )
        self.keyword_repository = KeywordMatchRepository(session)

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

    async def update_status(self, id: int, status: str):
        return await self.crud.update_status(id, status)

    async def handle_event(self, event: VkEvent) -> bool:
        logger.debug("ModerationService.handle_event: event_id=%s type=%s", event.event_id, event.event_type)
        if await self.crud.is_processed(event.event_id):
            logger.info("ModerationService.handle_event: duplicate event skipped event_id=%s", event.event_id)
            return False
        if event.event_type == "vk.comment_collected":
            await self._handle_comment_collected(event)
        elif event.event_type == "vk.task_completed":
            await self._handle_task_completed(event)
        else:
            logger.warning("ModerationService.handle_event: unsupported event type=%s", event.event_type)
        await self.crud.mark_processed(event.event_id, event.event_type)
        await self.session.commit()
        return True

    async def _handle_comment_collected(self, event: VkEvent) -> None:
        comment = event.payload.get("comment") or {}
        candidates = await self.keyword_repository.load_candidates()
        matched_keywords = KeywordMatcher(candidates).match_text(comment.get("text"))
        if not matched_keywords:
            logger.info(
                "ModerationService._handle_comment_collected: no keyword match event_id=%s matched_count=0",
                event.event_id,
            )
            return
        try:
            payload = map_vk_comment_event(comment, matched_keywords)
        except InvalidVkCommentEvent:
            logger.exception(
                "ModerationService._handle_comment_collected: invalid VK comment event_id=%s",
                event.event_id,
            )
            raise
        await self.crud.upsert_comment(payload)
        logger.info(
            "ModerationService._handle_comment_collected: saved comment event_id=%s key=%s matched_count=%d",
            event.event_id,
            payload["external_key"],
            len(matched_keywords),
        )

    async def _handle_task_completed(self, event: VkEvent) -> None:
        sm = self.session_maker
        if not sm:
            logger.warning(
                "ModerationService._handle_task_completed: session_maker not available, skipping recalculation"
            )
            return
        async with sm() as session:
            job = KeywordRecalculationJob(
                status="pending",
                created_at=datetime.now(UTC),
            )
            session.add(job)
            await session.commit()
            job_id = job.id
        logger.info(
            "ModerationService._handle_task_completed: created recalculation job=%d from event=%s",
            job_id, event.event_id,
        )
        worker = RecalculationWorker(sm)
        asyncio.create_task(worker.run_recalculation(job_id))
