import asyncio
import json
import logging

from common.events import ContentCanonicalCommentsChangedV1, WireEvent
from common.kafka.consumer import BaseEventConsumer
from prometheus_client import Gauge

from app.core.config import settings
from app.db.models import ProcessedEvent
from app.db.session import async_session_maker
from app.modules.moderation.service import (
    CANONICAL_COMMENTS_EVENT_TYPE,
    TASK_COMPLETED_EVENT_TYPE,
    ModerationService,
)

logger = logging.getLogger(__name__)

CONTENT_DLQ_TOPIC = "parsevk.moderation.dlq"
TASKS_DLQ_TOPIC = "parsevk.tasks.dlq"

try:
    _consumer_lag = Gauge(
        "kafka_consumer_lag",
        "Consumer lag per partition",
        ["topic", "consumer_group", "partition"],
    )
except ValueError:
    from prometheus_client.registry import REGISTRY

    _consumer_lag = REGISTRY._names_to_collectors["kafka_consumer_lag"]


class ProjectionConsumer(BaseEventConsumer):
    consumer_group = "moderation-service-content-group"
    consumer_name = "moderation-service-content"
    dlq_topic = CONTENT_DLQ_TOPIC
    auto_offset_reset = "earliest"

    def __init__(self):
        super().__init__(
            session_factory=async_session_maker,
            kafka_topic=settings.kafka_topic_content,
            bootstrap_servers=settings.kafka_bootstrap_servers,
            model_class=ProcessedEvent,
            lag_gauge=_consumer_lag,
        )

    async def handle_message(self, raw_value: bytes) -> None:
        event = WireEvent.model_validate(json.loads(raw_value.decode("utf-8")))
        if event.event_type != CANONICAL_COMMENTS_EVENT_TYPE:
            logger.debug("Ignoring unrelated content event type=%s", event.event_type)
            return
        if event.event_version != 1:
            raise ValueError(
                f"unsupported {CANONICAL_COMMENTS_EVENT_TYPE} version: {event.event_version}"
            )
        payload = ContentCanonicalCommentsChangedV1.model_validate(event.payload)
        async with self.session_factory() as session:
            async with session.begin():
                service = ModerationService(session)
                await service.handle_event(event, payload)


class TaskLifecycleConsumer(BaseEventConsumer):
    consumer_group = "moderation-service-tasks-group"
    consumer_name = "moderation-service-tasks"
    dlq_topic = TASKS_DLQ_TOPIC

    def __init__(self):
        super().__init__(
            session_factory=async_session_maker,
            kafka_topic=settings.kafka_topic_tasks,
            bootstrap_servers=settings.kafka_bootstrap_servers,
            model_class=ProcessedEvent,
            lag_gauge=_consumer_lag,
        )
        self._pending_recalculation_tasks: set[asyncio.Task] = set()

    async def handle_message(self, raw_value: bytes) -> None:
        event = WireEvent.model_validate(json.loads(raw_value.decode("utf-8")))
        if event.event_type != TASK_COMPLETED_EVENT_TYPE:
            logger.debug("Ignoring unrelated task event type=%s", event.event_type)
            return
        if event.event_version != 1:
            raise ValueError(
                f"unsupported {TASK_COMPLETED_EVENT_TYPE} version: {event.event_version}"
            )
        required = {"taskId", "runId", "ownerUserId", "taskRevision"}
        if not required.issubset(event.payload):
            raise ValueError("task.completed payload is missing required domain fields")
        if str(event.payload["taskId"]) != event.aggregate_id:
            raise ValueError("task.completed taskId does not match aggregate_id")

        async with self.session_factory() as session:
            async with session.begin():
                service = ModerationService(
                    session,
                    session_maker=async_session_maker,
                )
                await service.handle_task_completed(event)
                for pending in service.drain_pending_tasks():
                    self._pending_recalculation_tasks.add(pending)
                    pending.add_done_callback(
                        self._pending_recalculation_tasks.discard
                    )

    async def stop(self) -> None:
        for task in self._pending_recalculation_tasks:
            task.cancel()
        if self._pending_recalculation_tasks:
            await asyncio.gather(
                *self._pending_recalculation_tasks,
                return_exceptions=True,
            )
        await super().stop()
