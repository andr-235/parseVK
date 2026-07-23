"""Replay processor for re-emitting historical ImMessage rows via outbox."""

import logging
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.db.models import ImMessage, ReplayProgress, utcnow
from app.modules.outbox.repository import OutboxRepository
from app.modules.outbox.service import OutboxService

logger = logging.getLogger(__name__)


@dataclass
class ReplayBatchResult:
    processed_count: int
    last_im_message_id: int | None
    has_more: bool


class ReplayBatchProcessor:
    def __init__(
        self,
        db_session_factory: async_sessionmaker[AsyncSession],
    ) -> None:
        self.db_session_factory = db_session_factory

    def _make_outbox_service(self, session: AsyncSession) -> OutboxService:
        return OutboxService(OutboxRepository(session))

    async def run_batch(self, *, batch_size: int = 100) -> ReplayBatchResult:
        async with self.db_session_factory() as session:
            async with session.begin():
                outbox_service = self._make_outbox_service(session)

                progress = await session.scalar(
                    select(ReplayProgress).with_for_update()
                )
                last_id = progress.last_im_message_id if progress else 0

                result = await session.scalars(
                    select(ImMessage)
                    .where(ImMessage.id > last_id)
                    .order_by(ImMessage.id)
                    .limit(batch_size)
                )
                messages = list(result)

                for msg in messages:
                    if not msg.messenger or not msg.external_id or not msg.chat_external_id:
                        logger.warning(
                            "Replay message %d: missing required fields (messenger=%s external_id=%s chat_id=%s)",
                            msg.id,
                            msg.messenger,
                            msg.external_id,
                            msg.chat_external_id,
                        )
                        continue

                    logger.debug(
                        "Replay message %d: messenger=%s external_id=%s",
                        msg.id,
                        msg.messenger,
                        msg.external_id,
                    )
                    await outbox_service.emit_message_collected(
                        replay=True,
                        event_version=2,
                        messenger=msg.messenger,
                        message_id=msg.external_id,
                        chat_id=msg.chat_external_id,
                        chat_name=msg.chat_name,
                        author_name=msg.author,
                        text=msg.text,
                        content_url=msg.content_url,
                        content_type=msg.content_type,
                        raw=msg.raw or msg.metadata_raw,
                        created_at=msg.created_at,
                    )

                processed_count = len(messages)
                max_id = max((msg.id for msg in messages), default=None)
                has_more = len(messages) == batch_size

                if max_id is not None:
                    await self._save_progress(session, max_id)
                    last_id = max_id

                logger.info(
                    "Replay batch: %d messages processed, last_id=%s, has_more=%s",
                    processed_count,
                    last_id,
                    has_more,
                )

                return ReplayBatchResult(
                    processed_count=processed_count,
                    last_im_message_id=last_id,
                    has_more=has_more,
                )

    async def run_full(
        self, *, batch_size: int = 100, max_batches: int | None = None
    ) -> None:
        batches = 0
        while True:
            if max_batches is not None and batches >= max_batches:
                break
            result = await self.run_batch(batch_size=batch_size)
            batches += 1
            if not result.has_more:
                break

    async def _save_progress(self, session: AsyncSession, last_im_message_id: int) -> None:
        stmt = (
            insert(ReplayProgress)
            .values(
                id=1,
                last_im_message_id=last_im_message_id,
                updated_at=utcnow(),
            )
            .on_conflict_do_update(
                index_elements=[ReplayProgress.__table__.c.id],
                set_={
                    "last_im_message_id": last_im_message_id,
                    "updated_at": utcnow(),
                },
            )
        )
        await session.execute(stmt)
