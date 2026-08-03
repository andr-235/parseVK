"""Kafka consumer for canonical ``vk.execution.requested`` commands."""

import logging

from common.events import TaskEvent
from common.kafka.consumer import BaseEventConsumer
from parsevk_contracts.validation import parse_for_consume
from parsevk_contracts.vk.commands import (
    CATALOG as VK_COMMAND_CATALOG,
    VkExecutionRequestedV2,
)
from prometheus_client import Gauge, REGISTRY
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.bootstrap import get_task_events_handler
from app.core.config import settings
from app.infrastructure.db.models.tasks import ProcessedEvent

logger = logging.getLogger(__name__)

CONSUMER_NAME = "vk-service-vk-commands"
VK_EXECUTION_REQUESTED_VERSION = 2


def _create_lag_gauge() -> Gauge:
    name = "vk_commands_consumer_lag"
    try:
        return Gauge(
            name,
            "Canonical VK command consumer lag per partition",
            ["topic", "consumer_group", "partition"],
        )
    except ValueError:
        return REGISTRY._names_to_collectors[name]  # type: ignore[return-value]


_consumer_lag = _create_lag_gauge()


class VkExecutionCommandsConsumer(BaseEventConsumer):
    consumer_group = "vk-service-vk-commands-v2"
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

    async def handle_message(self, raw_value: bytes) -> None:
        parsed = parse_for_consume(
            VK_COMMAND_CATALOG,
            consumer="vk-service",
            topic=settings.kafka_topic_vk_commands,
            value=raw_value,
        )
        if parsed.contract.schema_version != VK_EXECUTION_REQUESTED_VERSION:
            raise ValueError(
                "active VK runtime requires vk.execution.requested schema v2"
            )
        command = parsed.envelope.payload
        if not isinstance(command, VkExecutionRequestedV2):
            raise TypeError(
                "vk.execution.requested v2 resolved to an unexpected model"
            )

        # PR06A feeds the fully validated canonical command into the existing
        # aggregate attachment service. PR06B removes this bridge and attaches
        # one physical source collection per command demand.
        group_ids = [
            int(demand.source.external_id)
            for demand in command.demands
        ]
        task_event = TaskEvent.model_validate(
            {
                "event_id": str(parsed.envelope.message_id),
                "event_type": "task.created",
                "event_version": 1,
                "aggregate_id": str(command.task_id),
                "correlation_id": str(parsed.envelope.correlation_id),
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
