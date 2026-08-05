"""Seed and publish canonical VK request/cancel commands for cross-service E2E."""

import asyncio
import json
import os
import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import uuid4

from aiokafka import AIOKafkaProducer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from parsevk_contracts.vk.commands import (
    CommentSelection,
    PostSelection,
    SourceReference,
    VkExecutionCancelRequested,
    VkExecutionRequested,
    VkSourceDemandRequest,
)

from app.bootstrap import ApplicationFactory
from app.db.base import Base
from app.db.models import OutboxEvent


def _required_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"{name} is required")
    return value


async def publish(metadata_path: Path) -> None:
    database_url = _required_env("TASKS_E2E_DATABASE_URL")
    bootstrap_servers = _required_env("TASKS_KAFKA_BOOTSTRAP_SERVERS")
    engine = create_async_engine(database_url, pool_pre_ping=True)
    sessions = async_sessionmaker(engine, expire_on_commit=False)

    task_run_id = uuid4()
    execution_id = uuid4()
    demand_id = uuid4()
    source_id = uuid4()
    request_event_id = uuid4()
    cancel_event_id = uuid4()
    task_id = 91001

    request = VkExecutionRequested(
        task_id=task_id,
        task_run_id=task_run_id,
        execution_id=execution_id,
        owner_user_id="e2e-user",
        demands=(
            VkSourceDemandRequest(
                demand_id=demand_id,
                source=SourceReference(
                    source_id=source_id,
                    provider="vk",
                    source_type="community",
                    external_id="777001",
                    owner_id=-777001,
                ),
            ),
        ),
        post_selection=PostSelection(
            strategy="latestByPublishedAt",
            limit_per_source=20,
        ),
        comment_selection=CommentSelection(
            mode="all",
            include_thread_replies=True,
        ),
        task_revision=4,
        source_set_revision=7,
        snapshot_sha256="a" * 64,
    )
    cancellation = VkExecutionCancelRequested(
        task_id=task_id,
        task_run_id=task_run_id,
        execution_id=execution_id,
        owner_user_id="e2e-user",
        reason="canonical-e2e-cancel",
    )

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    created_at = datetime.now(UTC)
    async with sessions() as session, session.begin():
        session.add_all(
            [
                OutboxEvent(
                    id=request_event_id,
                    event_type="vk.execution.requested",
                    aggregate_type="vk_execution",
                    aggregate_id=str(execution_id),
                    correlation_id=str(execution_id),
                    dedupe_key=f"e2e-request:{execution_id}",
                    payload=request.to_wire(),
                    created_at=created_at,
                ),
                OutboxEvent(
                    id=cancel_event_id,
                    event_type="vk.execution.cancel_requested",
                    aggregate_type="vk_execution",
                    aggregate_id=str(execution_id),
                    correlation_id=str(execution_id),
                    dedupe_key=f"e2e-cancel:{execution_id}",
                    payload=cancellation.to_wire(),
                    created_at=created_at + timedelta(milliseconds=1),
                ),
            ]
        )

    producer = AIOKafkaProducer(bootstrap_servers=bootstrap_servers)
    await producer.start()
    try:
        async with sessions() as session, session.begin():
            publisher = ApplicationFactory(
                session,
                producer=producer,
            ).create_outbox_publisher()
            first = await publisher.publish_batch(limit=10)
            second = await publisher.publish_batch(limit=10)
            if (first, second) != (1, 1):
                raise RuntimeError(
                    f"expected ordered batches (1, 1), got {(first, second)}"
                )
    finally:
        await producer.stop()

    async with sessions() as session:
        events = list(
            (
                await session.scalars(
                    select(OutboxEvent)
                    .where(OutboxEvent.aggregate_id == str(execution_id))
                    .order_by(OutboxEvent.created_at, OutboxEvent.id)
                )
            ).all()
        )
        if [event.status for event in events] != ["published", "published"]:
            raise RuntimeError("canonical outbox events were not marked published")

    metadata_path.write_text(
        json.dumps(
            {
                "taskId": task_id,
                "taskRunId": str(task_run_id),
                "executionId": str(execution_id),
                "demandId": str(demand_id),
                "sourceId": str(source_id),
                "requestEventId": str(request_event_id),
                "cancelEventId": str(cancel_event_id),
            }
        ),
        encoding="utf-8",
    )
    await engine.dispose()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("usage: _publish_canonical_commands.py METADATA_PATH")
    asyncio.run(publish(Path(sys.argv[1])))
