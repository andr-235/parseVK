import asyncio
import logging
from datetime import UTC, datetime

from common.events import ContentCanonicalCommentsChangedV1, WireEvent
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.db.models import KeywordRecalculationJob
from app.modules.keywords.matcher import KeywordMatcher
from app.modules.keywords.recalculation import RecalculationWorker
from app.modules.keywords.repository import KeywordMatchRepository
from app.modules.moderation.comment_event_mapper import (
    InvalidCanonicalCommentEvent,
    map_canonical_comment_snapshot,
)
from app.modules.moderation.crud_service import ModerationCrudService

logger = logging.getLogger(__name__)

CANONICAL_COMMENTS_EVENT_TYPE = "content.canonical_comments_changed"
TASK_COMPLETED_EVENT_TYPE = "task.completed"


class ModerationService:
    def __init__(
        self,
        session: AsyncSession,
        session_maker: async_sessionmaker | None = None,
    ):
        self.session = session
        self.session_maker = session_maker
        svc = self
        self.crud = ModerationCrudService(
            session,
            on_enrich=lambda records: svc._enrich_comments(records),
        )
        self.keyword_repository = KeywordMatchRepository(session)
        self._pending_tasks: list[asyncio.Task] = []

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
        if await self.crud.is_processed(event.event_id):
            logger.info("Duplicate canonical event skipped event_id=%s", event.event_id)
            return False
        if event.event_type != CANONICAL_COMMENTS_EVENT_TYPE:
            raise ValueError(f"unsupported canonical moderation event: {event.event_type}")
        await self._handle_canonical_comments(event, payload)
        await self.crud.mark_processed(event.event_id, event.event_type)
        return True

    async def handle_task_completed(self, event: WireEvent) -> bool:
        if await self.crud.is_processed(event.event_id):
            logger.info("Duplicate task completion skipped event_id=%s", event.event_id)
            return False
        if event.event_type != TASK_COMPLETED_EVENT_TYPE:
            raise ValueError(f"unsupported task lifecycle event: {event.event_type}")
        await self._schedule_recalculation(event)
        await self.crud.mark_processed(event.event_id, event.event_type)
        return True

    def drain_pending_tasks(self) -> list[asyncio.Task]:
        tasks = list(self._pending_tasks)
        self._pending_tasks.clear()
        return tasks

    async def _handle_canonical_comments(
        self,
        event: WireEvent,
        payload: ContentCanonicalCommentsChangedV1,
    ) -> None:
        if payload.postKey != event.aggregate_id:
            raise InvalidCanonicalCommentEvent(
                "canonical payload postKey does not match aggregate_id"
            )
        for comment in payload.comments:
            if f"{comment.ownerId}:{comment.postId}" != payload.postKey:
                raise InvalidCanonicalCommentEvent(
                    "canonical comment owner/post does not match payload postKey"
                )
        if not payload.comments:
            return

        candidates = await self.keyword_repository.load_candidates()
        matcher = KeywordMatcher(candidates)
        applied_count = 0
        matched_count = 0
        for comment in payload.comments:
            matched_keywords = matcher.match_text(comment.text or "")
            applied = await self.crud.apply_canonical_comment(
                map_canonical_comment_snapshot(comment, matched_keywords),
                payload.postRevision,
            )
            if applied:
                applied_count += 1
                if matched_keywords:
                    matched_count += 1

        logger.info(
            "Processed canonical batch event_id=%s revision=%d total_comments=%d applied=%d matched=%d",
            event.event_id,
            payload.postRevision,
            len(payload.comments),
            applied_count,
            matched_count,
        )

    async def _schedule_recalculation(self, event: WireEvent) -> None:
        sm = self.session_maker
        if sm is None:
            raise RuntimeError("session_maker is required for task.completed recalculation")
        async with sm() as session:
            job = KeywordRecalculationJob(
                status="pending",
                created_at=datetime.now(UTC),
            )
            session.add(job)
            await session.commit()
            job_id = job.id
        worker = RecalculationWorker(sm)
        task = asyncio.create_task(worker.run_recalculation(job_id))
        self._pending_tasks.append(task)
        task.add_done_callback(
            lambda completed: self._pending_tasks.remove(completed)
            if completed in self._pending_tasks
            else None
        )
        logger.info(
            "Created recalculation job=%d from canonical task event=%s",
            job_id,
            event.event_id,
        )
