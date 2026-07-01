import asyncio
import logging
import time
from datetime import UTC, datetime

from sqlalchemy import func, select

from app.core.config import settings
from app.db.models import ImMessage
from app.modules.ingestion.processor import process_chat_messages
from app.modules.ingestion.repository import IngestionRepository
from app.modules.whappi.client import MaxApiClient, WappiClient
from app.modules.whappi.models import SKIPPED_CHAT_IDS

logger = logging.getLogger(__name__)


class WappiPoller:
    def __init__(
        self,
        repository: IngestionRepository,
        wappi_client: WappiClient | None = None,
        max_client: MaxApiClient | None = None,
    ):
        self.repository = repository
        self._wappi = wappi_client or WappiClient()
        self._max = max_client or MaxApiClient()
        self._last_poll: dict[str, int | None] = {}

    async def close(self) -> None:
        await self._wappi.close()
        await self._max.close()

    async def start(self) -> None:
        now = int(time.time())
        for messenger in ("whatsapp", "max"):
            max_created = await self.repository.session.scalar(
                select(func.max(ImMessage.created_at)).where(ImMessage.messenger == messenger)
            )
            if max_created and isinstance(max_created, datetime):
                self._last_poll[messenger] = int(max_created.timestamp())
                logger.info("Poller %s: last message from %s", messenger, max_created.isoformat())
            else:
                self._last_poll[messenger] = now
                logger.info("Poller %s: no previous messages, starting from now", messenger)

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

            await self.repository.upsert_group(messenger, chat.chat_id, chat.name, chat.raw)

            try:
                raw_messages = await client.list_messages(chat.chat_id, time_from=last_ts)
            except Exception as exc:
                logger.error(
                    "Poller %s: failed to list messages for %s: %s", messenger, chat.chat_id, exc
                )
                continue

            if not raw_messages:
                continue

            try:
                count = await process_chat_messages(
                    messenger, chat.chat_id, raw_messages,
                    include_system=settings.wappi_include_system,
                    upsert_message_fn=lambda md: self.repository.upsert_message(messenger, md),
                )
                total += count
            except Exception as exc:
                logger.error(
                    "Poller %s: failed to process %d messages from %s: %s",
                    messenger, len(raw_messages), chat.chat_id, exc,
                )

        now = int(time.time())
        self._last_poll[messenger] = now

        try:
            await self.repository.session.commit()
            logger.info("Poller %s: %d new messages from %d chats", messenger, total, chat_count)
        except Exception as exc:
            await self.repository.session.rollback()
            logger.error("Poller %s: commit failed: %s", messenger, exc)

        return total

    async def run(self) -> None:
        await self.poll_messenger("whatsapp")
        await self.poll_messenger("max")


async def run_poller_forever(repository: IngestionRepository, poll_interval: int = 600) -> None:
    poller = WappiPoller(repository)
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
