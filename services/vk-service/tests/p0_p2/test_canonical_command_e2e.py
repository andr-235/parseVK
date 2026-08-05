import asyncio
import json
import os
import sys
from pathlib import Path
from uuid import UUID, uuid4

import pytest
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

sys.path.insert(0, str(Path(__file__).resolve().parent))
from canonical_e2e_support import (
    TOPIC,
    CanonicalE2EInfra,
    publish_from_tasks,
)

from app.infrastructure.db.base import Base
from app.infrastructure.db.models.executions import (  # noqa: F401
    VkExecution,
    VkExecutionAttempt,
)
from app.infrastructure.db.models.source_collections import (
    VkCollectionDemand,
    VkSourceCollection,
    VkTaskRunBinding,
)
from app.infrastructure.db.models.tasks import ProcessedEvent
from app.tasks.vk_commands_consumer import VkExecutionCommandsConsumer

pytestmark = pytest.mark.integration


async def _publish_duplicate(infra, message):
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


async def _assert_runtime_state(sessions, metadata, iteration: int) -> None:
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
        processed = await session.scalar(
            select(func.count()).select_from(ProcessedEvent)
        )

    assert binding is not None and binding.status == "cancelled"
    assert demand is not None and demand.status == "cancelled"
    assert collection is not None and collection.status == "cancelled"
    assert execution is not None and execution.status == "cancelled"
    assert processed == (iteration + 1) * 2


@pytest.mark.asyncio
async def test_tasks_outbox_to_canonical_vk_runtime_e2e(tmp_path: Path):
    infra = await CanonicalE2EInfra.start()
    engine = create_async_engine(infra.vk_database_url, pool_pre_ping=True)
    sessions = async_sessionmaker(engine, expire_on_commit=False)
    consumer = AIOKafkaConsumer(
        TOPIC,
        bootstrap_servers=infra.bootstrap_servers,
        group_id=f"p0-p2-e2e-{uuid4()}",
        auto_offset_reset="earliest",
        enable_auto_commit=False,
    )
    consumer_started = False
    try:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
        await consumer.start()
        consumer_started = True
        repo_root = Path(__file__).resolve().parents[4]
        repeats = int(os.getenv("P0_P2_E2E_REPEATS", "1"))

        for iteration in range(repeats):
            metadata_path = tmp_path / f"command-{iteration}.json"
            await asyncio.to_thread(
                publish_from_tasks,
                repo_root,
                infra,
                metadata_path,
            )
            raw_metadata = await asyncio.to_thread(
                metadata_path.read_text,
                encoding="utf-8",
            )
            metadata = json.loads(raw_metadata)
            execution_id = UUID(metadata["executionId"])

            request = await consumer.getone(timeout_ms=30000)
            cancellation = await consumer.getone(timeout_ms=30000)
            assert json.loads(request.value)["messageType"] == (
                "vk.execution.requested"
            )
            assert json.loads(cancellation.value)["messageType"] == (
                "vk.execution.cancel_requested"
            )
            expected_key = str(execution_id).encode()
            assert request.key == cancellation.key == expected_key

            await _publish_duplicate(infra, request)
            duplicate = await consumer.getone(timeout_ms=30000)
            command_consumer = VkExecutionCommandsConsumer(
                session_factory=sessions
            )
            await command_consumer.handle_message(request.value)
            await command_consumer.handle_message(cancellation.value)
            await command_consumer.handle_message(duplicate.value)
            await _assert_runtime_state(sessions, metadata, iteration)
    finally:
        if consumer_started:
            await consumer.stop()
        await engine.dispose()
        infra.stop()
