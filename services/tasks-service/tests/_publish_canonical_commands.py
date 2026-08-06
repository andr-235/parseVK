"""Publish canonical VK commands through the real tasks outbox."""

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
    events = [
        OutboxEvent(
            id=fixture.request_event_id,
            event_type="vk.execution.requested",
            aggregate_type="vk_execution",
            aggregate_id=str(execution_id),
            correlation_id=str(execution_id),
            dedupe_key=f"e2e-request:{execution_id}",
            payload=fixture.request.to_wire(),
            created_at=created_at,
        )
    ]
    if fixture.cancellation is not None and fixture.cancel_event_id is not None:
        events.append(
            OutboxEvent(
                id=fixture.cancel_event_id,
                event_type="vk.execution.cancel_requested",
                aggregate_type="vk_execution",
                aggregate_id=str(execution_id),
                correlation_id=str(execution_id),
                dedupe_key=f"e2e-cancel:{execution_id}",
                payload=fixture.cancellation.to_wire(),
                created_at=created_at + timedelta(milliseconds=1),
            )
        )
    async with sessions() as session, session.begin():
        session.add_all(events)


async def _publish_events(
    sessions,
    bootstrap_servers: str,
    expected_events: int,
) -> None:
    producer = AIOKafkaProducer(bootstrap_servers=bootstrap_servers)
    await producer.start()
    try:
        published = []
        for _ in range(expected_events):
            async with sessions() as session, session.begin():
                publisher = ApplicationFactory(
                    session,
                    producer=producer,
                ).create_outbox_publisher()
                published.append(await publisher.publish_batch(limit=10))
        if published != [1] * expected_events:
            raise RuntimeError(f"unexpected ordered batches: {published}")
    finally:
        await producer.stop()


async def publish(metadata_path: Path, scenario: str) -> None:
    if scenario not in {"cancel", "recovery"}:
        raise ValueError(f"unsupported E2E scenario: {scenario}")
    database_url = _required_env("TASKS_E2E_DATABASE_URL")
    bootstrap_servers = _required_env("TASKS_KAFKA_BOOTSTRAP_SERVERS")
    engine = create_async_engine(database_url, pool_pre_ping=True)
    sessions = async_sessionmaker(engine, expire_on_commit=False)
    fixture = build_fixture(include_cancellation=scenario == "cancel")
    expected_events = 2 if fixture.cancellation is not None else 1
    try:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
        await _seed_events(sessions, fixture)
        await _publish_events(sessions, bootstrap_servers, expected_events)

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
            if len(events) != expected_events or any(
                event.status != "published" for event in events
            ):
                raise RuntimeError(
                    "canonical outbox events were not marked published"
                )

        await asyncio.to_thread(
            metadata_path.write_text,
            json.dumps(fixture.metadata()),
            encoding="utf-8",
        )
    finally:
        await engine.dispose()


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit(
            "usage: _publish_canonical_commands.py METADATA_PATH SCENARIO"
        )
    asyncio.run(publish(Path(sys.argv[1]), sys.argv[2]))
