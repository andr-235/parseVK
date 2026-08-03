"""Kafka consumer for canonical ``vk.execution.requested`` commands."""

import json
import logging

from common.events import TaskEvent, WireEvent
from common.kafka.consumer import BaseEventConsumer
from parsevk_contracts.vk.commands import VkExecutionRequested
from prometheus_client import Gauge
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.bootstrap import get_task_events_handler
from app.core.config import settings
from app.infrastructure.db.models.tasks import ProcessedEvent

logger = logging.getLogger(__name__)

CONSUMER_NAME = "vk-service-vk-commands"

_consumer_lag = Gauge(
    "vk_commands_consumer_lag",
    "Canonical VK command consumer lag per partition",
    ["topic", "consumer_group", "partition"],
)


class VkExecutionCommandsConsumer(BaseEventConsumer):
    consumer_group = "vk-service-vk-commands-v1"
    consumer_name = CONSUMER_NAME
    dlq_topic = settings.kafka_topic_vk_commands_dlq

    def __init__(
        self,
        *,
        session_factory: async_sessionmaker,
    ):
        super().__init__(
            session_factory=session_factory,
            kafka_topic=settings.kafka_topic_vk_commands,
            bootstrap_servers=settings.kafka_bootstrap_servers,
            model_class=ProcessedEvent,
            lag_gauge=_consumer_lag,
        )

    async def handle_message(
        self,
        raw_value: bytes | str | dict,
    ) -> None:
        if isinstance(raw_value, bytes):
            raw_value = raw_value.decode("utf-8")
        payload = json.loads(raw_value) if isinstance(raw_value, str) else raw_value
        wire = WireEvent.model_validate(payload)
        if wire.event_type != "vk.execution.requested":
            raise ValueError(
                f"unsupported VK command type: {wire.event_type}"
            )
        if wire.event_version != 1:
            raise ValueError(
                f"unsupported vk.execution.requested version: {wire.event_version}"
            )

        command = VkExecutionRequested.model_validate(wire.payload)
        if not command.owner_user_id:
            raise ValueError("vk.execution.requested requires ownerUserId")
        if wire.correlation_id != str(command.execution_id):
            raise ValueError(
                "vk.execution.requested correlationId must equal executionId"
            )
        if wire.aggregate_id != str(command.execution_id):
            raise ValueError(
                "vk.execution.requested aggregateId must equal executionId"
            )

        # PR06A feeds the validated canonical command into the existing aggregate
        # attachment service. PR06B replaces this transitional translation with
        # one source-level attachment per command demand.
        group_ids = [
            int(demand.source.external_id)
            for demand in command.demands
        ]
        task_event = TaskEvent.model_validate(
            {
                "event_id": wire.event_id,
                "event_type": "task.created",
                "event_version": 1,
                "aggregate_id": str(command.task_id),
                "correlation_id": wire.correlation_id,
                "payload": {
                    "taskId": str(command.task_id),
                    "ownerUserId": command.owner_user_id,
                    "runId": str(command.task_run_id),
                    "scope": "selected",
                    "mode": "recent_posts",
                    "groupIds": group_ids,
                    "postLimit": command.post_selection.limit_per_source,
                },
            }
        )
        async with self.session_factory() as session:
            handler = get_task_events_handler(session)
            await handler.handle(task_event)
