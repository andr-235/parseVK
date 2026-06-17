import asyncio
import json
import logging

from aiokafka import AIOKafkaConsumer
<<<<<<< HEAD

=======
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da
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
        )
        await self.consumer.start()
        logger.info("Kafka consumer started")

    async def stop(self):
        if self.consumer:
            await self.consumer.stop()
            logger.info("Kafka consumer stopped")

    async def run_forever(self):
        await self.start()
        try:
            async for msg in self.consumer:
                try:
                    payload = json.loads(msg.value.decode("utf-8"))
                    event = VkEvent.model_validate(payload)
                    async with async_session_maker() as session:
                        service = ModerationService(session)
                        await service.handle_event(event)
                except Exception as e:
                    logger.exception("Error processing message", exc_info=e)
        except asyncio.CancelledError:
            pass
