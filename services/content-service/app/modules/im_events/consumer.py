import json
import logging
from contextlib import suppress

from sqlalchemy.ext.asyncio import async_sessionmaker

from app.core.config import settings
from app.db.session import SessionLocal
from app.modules.im_events.service import ImEvent, ImEventRepository, ImEventService

logger = logging.getLogger(__name__)


class ImEventConsumer:
    def __init__(self, *, session_factory: async_sessionmaker | None = None):
        self.session_factory = session_factory or SessionLocal
        self._consumer = None

    async def run_forever(self) -> None:
        from aiokafka import AIOKafkaConsumer

        self._consumer = AIOKafkaConsumer(
            settings.kafka_topic_im,
            bootstrap_servers=settings.kafka_bootstrap_servers,
            group_id="content-service-im",
            enable_auto_commit=False,
        )
        await self._consumer.start()
        logger.info("Kafka IM consumer started, group=content-service-im, topic=%s", settings.kafka_topic_im)
        try:
            async for message in self._consumer:
                try:
                    await self.handle_message(message.value)
                    await self._consumer.commit()
                except Exception as exc:
                    logger.exception("Failed to process IM message at offset %s", message.offset)
        finally:
            await self.stop()

    async def handle_message(self, raw_value: bytes | str | dict) -> None:
        if isinstance(raw_value, bytes):
            raw_value = raw_value.decode("utf-8")
        payload = json.loads(raw_value) if isinstance(raw_value, str) else raw_value
        event = ImEvent.model_validate(payload)
        async with self.session_factory() as session:
            async with session.begin():
                await ImEventService(ImEventRepository(session)).handle(event)

    async def stop(self) -> None:
        if self._consumer is not None:
            with suppress(Exception):
                await self._consumer.stop()
            self._consumer = None
