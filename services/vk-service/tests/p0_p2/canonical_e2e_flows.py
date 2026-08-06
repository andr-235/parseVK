import asyncio
import json
from uuid import UUID

from aiokafka import AIOKafkaProducer
from canonical_e2e_recovery import run_crash_recovery
from canonical_e2e_support import TOPIC
from sqlalchemy import select

from app.infrastructure.db.models.executions import VkExecution
from app.infrastructure.db.models.source_collections import (
    VkCollectionDemand,
    VkSourceCollection,
    VkTaskRunBinding,
)
from app.infrastructure.db.models.tasks import ProcessedEvent
from app.tasks.vk_commands_consumer import VkExecutionCommandsConsumer


async def _getone(consumer):
    return await asyncio.wait_for(consumer.getone(), timeout=30)


async def _publish_duplicate(infra, message) -> None:
    producer = AIOKafkaProducer(
        bootstrap_servers=infra.bootstrap_servers
    )
    await producer.start()
    try:
        await producer.send_and_wait(
            TOPIC,
            key=message.key,
            value=message.value,
            headers=message.headers,
        )
    finally:
        await producer.stop()


async def _consume_duplicate(consumer, infra, request):
    await _publish_duplicate(infra, request)
    return await _getone(consumer)


async def _assert_processed(sessions, metadata, *, include_cancel: bool) -> None:
    expected = {UUID(metadata["requestEventId"])}
    if include_cancel:
        expected.add(UUID(metadata["cancelEventId"]))
    async with sessions() as session:
        actual = set(
            (
                await session.scalars(
                    select(ProcessedEvent.event_id).where(
                        ProcessedEvent.event_id.in_(expected)
                    )
                )
            ).all()
        )
    assert actual == expected


async def _assert_cancelled(sessions, metadata) -> None:
    execution_id = UUID(metadata["executionId"])
    async with sessions() as session:
        binding = await session.scalar(
            select(VkTaskRunBinding).where(
                VkTaskRunBinding.command_execution_id == execution_id
            )
        )
        demand = await session.scalar(
            select(VkCollectionDemand).where(
                VkCollectionDemand.demand_id == UUID(metadata["demandId"])
            )
        )
        collection = await session.scalar(
            select(VkSourceCollection).where(
                VkSourceCollection.source_id == UUID(metadata["sourceId"])
            )
        )
        execution = await session.scalar(
            select(VkExecution).where(
                VkExecution.task_id == metadata["taskId"],
                VkExecution.run_id == metadata["taskRunId"],
            )
        )
    assert binding is not None and binding.status == "cancelled"
    assert demand is not None and demand.status == "cancelled"
    assert collection is not None and collection.status == "cancelled"
    assert execution is not None and execution.status == "cancelled"


async def run_cancel_flow(consumer, infra, sessions, metadata) -> None:
    request = await _getone(consumer)
    cancellation = await _getone(consumer)
    assert json.loads(request.value)["messageType"] == "vk.execution.requested"
    assert json.loads(cancellation.value)["messageType"] == (
        "vk.execution.cancel_requested"
    )
    expected_key = metadata["executionId"].encode()
    assert request.key == cancellation.key == expected_key
    duplicate = await _consume_duplicate(consumer, infra, request)

    command_consumer = VkExecutionCommandsConsumer(session_factory=sessions)
    await command_consumer.handle_message(request.value)
    await command_consumer.handle_message(cancellation.value)
    await command_consumer.handle_message(duplicate.value)
    await _assert_cancelled(sessions, metadata)
    await _assert_processed(sessions, metadata, include_cancel=True)


async def run_recovery_flow(consumer, infra, sessions, metadata) -> None:
    request = await _getone(consumer)
    assert json.loads(request.value)["messageType"] == "vk.execution.requested"
    assert request.key == metadata["executionId"].encode()
    duplicate = await _consume_duplicate(consumer, infra, request)

    command_consumer = VkExecutionCommandsConsumer(session_factory=sessions)
    await command_consumer.handle_message(request.value)
    await command_consumer.handle_message(duplicate.value)
    await _assert_processed(sessions, metadata, include_cancel=False)
    await run_crash_recovery(sessions, metadata)
