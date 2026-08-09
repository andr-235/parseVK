import logging

from app.modules.keywords.matcher import KeywordMatcher
from app.modules.keywords.repository import KeywordMatchRepository
from app.modules.moderation.comment_event_mapper import (
    InvalidCanonicalCommentEvent,
    map_canonical_comment_event,
)
from app.modules.moderation.crud_service import ModerationCrudService
from common.events import ContentCanonicalCommentsChangedV1, WireEvent
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

CANONICAL_COMMENTS_EVENT_TYPE = "content.canonical_comments_changed"


class ModerationService:
    def __init__(self, session: AsyncSession):
        self.session = session
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

    async def handle_event(
        self,
        event: WireEvent,
        payload: ContentCanonicalCommentsChangedV1,
    ) -> bool:
        logger.debug(
            "ModerationService.handle_event: event_id=%s type=%s",
            event.event_id,
            event.event_type,
        )
        if await self.crud.is_processed(event.event_id):
            logger.info(
                "ModerationService.handle_event: duplicate event skipped event_id=%s",
                event.event_id,
            )
            return False
        if event.event_type != CANONICAL_COMMENTS_EVENT_TYPE:
            raise ValueError(f"unsupported canonical moderation event: {event.event_type}")
        await self._handle_canonical_comments(event, payload)
        await self.crud.mark_processed(event.event_id, event.event_type)
        return True

    async def _handle_canonical_comments(
        self,
        event: WireEvent,
        payload: ContentCanonicalCommentsChangedV1,
    ) -> None:
        if payload.postKey != event.aggregate_id:
            raise InvalidCanonicalCommentEvent(
                "canonical payload postKey does not match aggregate_id"
            )
        if payload.chunkIndex >= payload.chunkCount:
            raise InvalidCanonicalCommentEvent(
                "canonical payload chunkIndex must be smaller than chunkCount"
            )
        if not payload.comments:
            logger.debug(
                "ModerationService._handle_canonical_comments: empty batch event_id=%s",
                event.event_id,
            )
            return

        candidates = await self.keyword_repository.load_candidates()
        matcher = KeywordMatcher(candidates)
        saved_count = 0
        for comment in payload.comments:
            text = comment.text or ""
            matched_keywords = matcher.match_text(text)
            if not matched_keywords:
                continue
            mapped = map_canonical_comment_event(comment, matched_keywords)
            await self.crud.upsert_comment(mapped)
            saved_count += 1

        logger.info(
            "Processed canonical batch event_id=%s total_comments=%d matched_saved=%d",
            event.event_id,
            len(payload.comments),
            saved_count,
        )
