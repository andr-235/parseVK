import asyncio
import json
import logging

from aiokafka import AIOKafkaConsumer
from app.core.config import settings
from app.db.session import async_session_maker
from app.modules.moderation.schemas import VkEvent
from app.modules.moderation.service import ModerationService

logger = logging.getLogger(__name__)


class ProjectionConsumer:
    def __init__(self):
        self.consumer = None

    async def start(self):
        self.consumer = AIOKafkaConsumer(
            settings.kafka_topic_vk,
            bootstrap_servers=settings.kafka_bootstrap_servers,
            group_id="moderation-service-group",
            auto_offset_reset="earliest",
            enable_auto_commit=False,
        )
        await self.consumer.start()
        logger.info(
            "Moderation Kafka consumer started topic=%s group=%s",
            settings.kafka_topic_vk,
            "moderation-service-group",
        )

    async def stop(self):
        if self.consumer:
            await self.consumer.stop()
            logger.info("Moderation Kafka consumer stopped")

    async def run_forever(self):
        await self.start()
        try:
            async for msg in self.consumer:
                try:
                    payload = json.loads(msg.value.decode("utf-8"))
                    event = VkEvent.model_validate(payload)
                    logger.debug(
                        "Moderation Kafka message received event_id=%s type=%s offset=%s",
                        event.event_id,
                        event.event_type,
                        msg.offset,
                    )
                    async with async_session_maker() as session:
                        service = ModerationService(session)
                        await service.handle_event(event)
                    await self.consumer.commit()
                except Exception as e:
                    logger.exception(
                        "Error processing moderation Kafka message offset=%s",
                        getattr(msg, "offset", None),
                        exc_info=e,
                    )
        except asyncio.CancelledError:
            pass
