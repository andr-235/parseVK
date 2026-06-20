import asyncio
from contextlib import suppress

from app.core.config import settings
from app.domain.events.models import ImEvent, VkEvent
from app.infrastructure.db.repositories.im_projection import ImProjectionRepository
from app.infrastructure.db.repositories.vk_projection import VkProjectionRepository
from app.infrastructure.db.session import SessionLocal
from app.infrastructure.messaging.consumer import KafkaProjectionConsumer
from app.services.projections.im import ImProjectionService
from app.services.projections.vk import VkProjectionService


class ProjectionWorkers:
    def __init__(self):
        common = {
            "session_factory": SessionLocal,
            "max_attempts": settings.kafka_retry_max_attempts,
            "backoff_seconds": settings.kafka_retry_backoff_seconds,
            "poison_policy": settings.kafka_poison_policy,
            "bootstrap_servers": settings.kafka_bootstrap_servers,
        }
        self.vk = KafkaProjectionConsumer(
            topic=settings.kafka_topic_vk,
            group_id=settings.kafka_group_vk,
            event_model=VkEvent,
            handler_factory=lambda session: VkProjectionService(
                VkProjectionRepository(session)
            ),
            **common,
        )
        self.im = KafkaProjectionConsumer(
            topic=settings.kafka_topic_im,
            group_id=settings.kafka_group_im,
            event_model=ImEvent,
            handler_factory=lambda session: ImProjectionService(
                ImProjectionRepository(session)
            ),
            **common,
        )
        self.tasks: list[asyncio.Task] = []

    @property
    def healthy(self) -> bool:
        return self.vk.healthy and self.im.healthy

    def start(self) -> None:
        self.tasks = [
            asyncio.create_task(self.vk.run_forever()),
            asyncio.create_task(self.im.run_forever()),
        ]

    async def stop(self) -> None:
        for task in self.tasks:
            task.cancel()
        for task in self.tasks:
            with suppress(asyncio.CancelledError):
                await task
        await self.vk.stop()
        await self.im.stop()
        self.tasks.clear()
