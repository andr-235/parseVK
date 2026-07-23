import asyncio
import logging
import time
from datetime import datetime

from prometheus_client import Counter
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

# Poller metrics
_poller_chat_runs = Counter(
    "im_poller_chat_runs_total",
    "Per-chat poll runs by status",
    ["messenger", "status"],
)
_poller_messages_processed = Counter(
    "im_poller_messages_processed_total",
    "Messages processed per messenger",
    ["messenger"],
)
_poller_sanitized_values = Counter(
    "im_poller_sanitized_values_total",
    "Sanitized values count",
    ["messenger", "source"],
)
_poller_failures = Counter(
    "im_poller_failures_total",
    "Poller failures by stage",
    ["messenger", "stage"],
)
_poller_outbox_events = Counter(
    "im_poller_outbox_events_total",
    "Outbox events by result (inserted|deduplicated)",
    ["messenger", "result"],
)


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

    async def poll_messenger(self, messenger: str) -> tuple[int, bool]:
        client = self._wappi if messenger == "whatsapp" else self._max
        cycle_started_at = int(time.time())
        previous_cursor = self._last_poll.get(messenger)

        try:
            chats = await client.list_chats()
        except Exception as exc:
            logger.error("Poller %s: failed to list chats: %s", messenger, exc)
            return 0, False

        total = 0
        chat_count = 0
        chat_failed = False

        for chat in chats:
            if chat.chat_id in SKIPPED_CHAT_IDS:
                continue

            chat_count += 1
            _poller_chat_runs.labels(messenger=messenger, status="started").inc()

            # Per-chat session and transaction
            async with self.session_factory() as session:
                async with session.begin():
                    repository = IngestionRepository(session)
                    logger.debug("poll_messenger: chat=%s session opened", chat.chat_id)

                    # Sanitize group data before persistence
                    sanitized_name = sanitize_postgres_text(chat.name)
                    if chat.raw:
                        sanitized = sanitize_source_payload(chat.raw)
                        sanitized_raw = sanitized.value
                        replacements = sanitized.replacements
                        if replacements:
                            _poller_sanitized_values.labels(
                                messenger=messenger, source="raw"
                            ).inc(replacements)
                    else:
                        sanitized_raw = None
                    await repository.upsert_group(messenger, chat.chat_id, sanitized_name, sanitized_raw)

                    outbox_repo = OutboxRepository(session)
                    outbox = OutboxService(outbox_repo)
                    logger.debug("poll_messenger: outbox service created chat=%s", chat.chat_id)

                    try:
                        raw_messages = await client.list_messages(chat.chat_id, time_from=previous_cursor)
                    except Exception as exc:
                        logger.error(
                            "Poller %s: failed to list messages for %s: %s",
                            messenger, chat.chat_id, exc,
                        )
                        chat_failed = True
                        _poller_failures.labels(messenger=messenger, stage="fetch").inc()
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
                                lambda n: _track_outbox_event(
                                    messenger, outbox, n,
                                )
                            ),
                        )
                        total += count
                        _poller_messages_processed.labels(messenger=messenger).inc(count)
                        _poller_chat_runs.labels(messenger=messenger, status="success").inc()
                        logger.info(
                            "poll_messenger: chat=%s transaction committed messages=%d",
                            chat.chat_id, count,
                        )
                    except Exception as exc:
                        logger.error(
                            "Poller %s: failed to process %d messages from %s: %s",
                            messenger, len(raw_messages), chat.chat_id, exc,
                        )
                        chat_failed = True
                        _poller_failures.labels(messenger=messenger, stage="process").inc()
                        # Transaction will roll back on __aexit__

        logger.info(
            "poll_messenger: cycle summary messenger=%s success=%s processed=%d",
            messenger, not chat_failed, total,
        )
        if not chat_failed and chat_count > 0:
            self._last_poll[messenger] = cycle_started_at
            logger.info("poll_messenger: cursor advanced messenger=%s to=%d", messenger, cycle_started_at)
        elif chat_failed:
            logger.warning("poll_messenger: cursor NOT advanced messenger=%s due to chat failures", messenger)

        return total, not chat_failed

    async def run(self) -> None:
        await self.poll_messenger("whatsapp")
        await self.poll_messenger("max")


async def _track_outbox_event(messenger: str, outbox: OutboxService, normalized):
    inserted = await outbox.emit_message_collected(
        messenger=normalized.messenger, message_id=normalized.external_id,
        chat_id=normalized.chat_id, chat_name=normalized.chat_name,
        author_id=normalized.author_id, author_name=normalized.author_name,
        text=normalized.text, content_url=normalized.content_url,
        content_type=normalized.content_type, created_at=normalized.created_at,
        raw=normalized.raw, event_version=2,
    )
    result = "inserted" if inserted else "deduplicated"
    _poller_outbox_events.labels(messenger=messenger, result=result).inc()


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
