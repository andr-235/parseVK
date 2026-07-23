import asyncio
import logging
import time
from datetime import datetime

from sqlalchemy import func, select

from app.core.config import settings
from app.db.models import ImMessage, ImMessengerCursor
from app.modules.ingestion.processor import process_chat_messages
from app.modules.ingestion.repository import IngestionRepository
from app.modules.ingestion.sanitization import (
    sanitize_postgres_text,
    sanitize_source_payload,
)
from app.modules.outbox.repository import OutboxRepository
from app.modules.outbox.service import OutboxService
from app.modules.whappi.client import MaxApiClient, WappiClient
from app.modules.whappi.models import SKIPPED_CHAT_IDS

logger = logging.getLogger(__name__)


class WappiPoller:
    def __init__(
        self,
        session_factory,
        wappi_client: WappiClient | None = None,
        max_client: MaxApiClient | None = None,
    ):
        self.session_factory = session_factory
        self._wappi = wappi_client or WappiClient()
        self._max = max_client or MaxApiClient()
        self._last_poll: dict[str, int | None] = {}

    async def close(self) -> None:
        await self._wappi.close()
        await self._max.close()

    async def start(self) -> None:
        async with self.session_factory() as session:
            for messenger in ("whatsapp", "max"):
                cursor = await session.get(ImMessengerCursor, messenger)
                if cursor is not None:
                    self._last_poll[messenger] = cursor.last_poll
                    logger.info("Poller %s: cursor loaded last_poll=%d", messenger, cursor.last_poll)
                else:
                    # Fallback: latest message timestamp or current time
                    max_created = await session.scalar(
                        select(func.max(ImMessage.created_at)).where(ImMessage.messenger == messenger)
                    )
                    if max_created and isinstance(max_created, datetime):
                        self._last_poll[messenger] = int(max_created.timestamp())
                        logger.info("Poller %s: fallback to last message %s", messenger, max_created.isoformat())
                    else:
                        now = int(time.time())
                        self._last_poll[messenger] = now
                        logger.info("Poller %s: no previous data, starting from now", messenger)

    async def poll_messenger(self, messenger: str) -> int:
        client = self._wappi if messenger == "whatsapp" else self._max
        last_ts = self._last_poll.get(messenger)

        try:
            chats = await client.list_chats()
        except Exception as exc:
            logger.error("Poller %s: failed to list chats: %s", messenger, exc)
            return 0

        total = 0
        chat_count = 0

        for chat in chats:
            if chat.chat_id in SKIPPED_CHAT_IDS:
                continue

            chat_count += 1

            # Per-chat session and transaction
            async with self.session_factory() as session:
                async with session.begin():
                    repository = IngestionRepository(session)
                    logger.debug("poll_messenger: chat=%s session opened", chat.chat_id)

                    # Sanitize group data before persistence
                    sanitized_name = sanitize_postgres_text(chat.name)
                    sanitized_raw = sanitize_source_payload(chat.raw).value if chat.raw else None
                    await repository.upsert_group(messenger, chat.chat_id, sanitized_name, sanitized_raw)

                    outbox_repo = OutboxRepository(session)
                    outbox = OutboxService(outbox_repo)
                    logger.debug("poll_messenger: outbox service created chat=%s", chat.chat_id)

                    try:
                        raw_messages = await client.list_messages(chat.chat_id, time_from=last_ts)
                    except Exception as exc:
                        logger.error(
                            "Poller %s: failed to list messages for %s: %s",
                            messenger, chat.chat_id, exc,
                        )
                        # Transaction will roll back on __aexit__
                        continue  # skip this chat, move to next

                    if not raw_messages:
                        continue

                    try:
                        count = await process_chat_messages(
                            messenger, chat.chat_id, raw_messages,
                            include_system=settings.wappi_include_system,
                            upsert_message_fn=repository.upsert_message,
                            emit_message_collected_fn=(
                                lambda n: outbox.emit_message_collected(
                                    messenger=n.messenger, message_id=n.external_id,
                                    chat_id=n.chat_id, chat_name=n.chat_name,
                                    author_id=n.author_id, author_name=n.author_name,
                                    text=n.text, content_url=n.content_url,
                                    content_type=n.content_type, created_at=n.created_at,
                                    raw=n.raw, event_version=2,
                                )
                            ),
                        )
                        total += count
                        logger.info(
                            "poll_messenger: chat=%s transaction committed messages=%d",
                            chat.chat_id, count,
                        )
                    except Exception as exc:
                        logger.error(
                            "Poller %s: failed to process %d messages from %s: %s",
                            messenger, len(raw_messages), chat.chat_id, exc,
                        )
                        # Transaction will roll back on __aexit__

        # Cursor advancement will be handled by Task 11 (cycle-start watermark)
        # For now, keep in-memory cursor (will be overridden by Task 11)
        return total

    async def run(self) -> None:
        await self.poll_messenger("whatsapp")
        await self.poll_messenger("max")


async def run_poller_forever(session_factory, poll_interval: int = 600) -> None:
    poller = WappiPoller(session_factory)
    await poller.start()
    logger.info("WappiPoller started (interval=%ds)", poll_interval)

    try:
        while True:
            try:
                await poller.run()
            except Exception as e:
                logger.error("Poller cycle failed: %s", e, exc_info=True)
            await asyncio.sleep(poll_interval)
    finally:
        await poller.close()
