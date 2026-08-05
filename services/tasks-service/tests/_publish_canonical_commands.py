"""Seed and publish canonical VK request/cancel commands for cross-service E2E."""

import asyncio
import json
import os
import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path

from aiokafka import AIOKafkaProducer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _canonical_e2e_messages import build_fixture
from _service_path import use_service_path

use_service_path()

from app.bootstrap import ApplicationFactory
from app.db.base import Base
from app.db.models import OutboxEvent


def _required_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"{name} is required")
    return value


async def _seed_events(sessions, fixture) -> None:
    created_at = datetime.now(UTC)
    execution_id = fixture.request.execution_id
    async with sessions() as session, session.begin():
        session.add_all(
            [
                OutboxEvent(
                    id=fixture.request_event_id,
                    event_type="vk.execution.requested",
                    aggregate_type="vk_execution",
                    aggregate_id=str(execution_id),
                    correlation_id=str(execution_id),
                    dedupe_key=f"e2e-request:{execution_id}",
                    payload=fixture.request.to_wire(),
                    created_at=created_at,
                ),
                OutboxEvent(
                    id=fixture.cancel_event_id,
                    event_type="vk.execution.cancel_requested",
                    aggregate_type="vk_execution",
                    aggregate_id=str(execution_id),
                    correlation_id=str(execution_id),
                    dedupe_key=f"e2e-cancel:{execution_id}",
                    payload=fixture.cancellation.to_wire(),
                    created_at=created_at + timedelta(milliseconds=1),
                ),
            ]
        )


async def _publish_events(sessions, bootstrap_servers: str) -> None:
    producer = AIOKafkaProducer(bootstrap_servers=bootstrap_servers)
    await producer.start()
    try:
        async with sessions() as session, session.begin():
            publisher = ApplicationFactory(
                session,
                producer=producer,
            ).create_outbox_publisher()
            batches = (
                await publisher.publish_batch(limit=10),
                await publisher.publish_batch(limit=10),
            )
            if batches != (1, 1):
                raise RuntimeError(
                    f"expected ordered batches (1, 1), got {batches}"
                )
    finally:
        await producer.stop()


async def publish(metadata_path: Path) -> None:
    database_url = _required_env("TASKS_E2E_DATABASE_URL")
    bootstrap_servers = _required_env("TASKS_KAFKA_BOOTSTRAP_SERVERS")
    engine = create_async_engine(database_url, pool_pre_ping=True)
    sessions = async_sessionmaker(engine, expire_on_commit=False)
    fixture = build_fixture()
    try:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
        await _seed_events(sessions, fixture)
        await _publish_events(sessions, bootstrap_servers)

        async with sessions() as session:
            events = list(
                (
                    await session.scalars(
                        select(OutboxEvent)
                        .where(
                            OutboxEvent.aggregate_id
                            == str(fixture.request.execution_id)
                        )
                        .order_by(OutboxEvent.created_at, OutboxEvent.id)
                    )
                ).all()
            )
            if [event.status for event in events] != [
                "published",
                "published",
            ]:
                raise RuntimeError(
                    "canonical outbox events were not marked published"
                )

        metadata_path.write_text(
            json.dumps(fixture.metadata()),
            encoding="utf-8",
        )
    finally:
        await engine.dispose()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("usage: _publish_canonical_commands.py METADATA_PATH")
    asyncio.run(publish(Path(sys.argv[1])))
