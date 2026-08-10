from __future__ import annotations

import asyncio
import os
import sys
from hashlib import sha256
from pathlib import Path
from uuid import UUID, uuid4, uuid5

import asyncpg
import pytest
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
from aiokafka.admin import AIOKafkaAdminClient, NewTopic
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from testcontainers.core.container import DockerContainer
from testcontainers.kafka import KafkaContainer

TEST_DIR = Path(__file__).resolve().parent
TESTS_DIR = TEST_DIR.parent
sys.path.insert(0, str(TESTS_DIR))
from _service_path import use_service_path

use_service_path()

from common.events import WireEvent

from app.db.base import Base
from app.db.models import ContentComment, ContentOutboxEvent, ProcessedEvent
from app.modules.ingestion.canonical_events import (
    CANONICAL_COMMENTS_EVENT_TYPE,
    MANIFEST_KEY,
)
from app.modules.ingestion.canonical_repository import CanonicalIngestionRepository
from app.modules.ingestion.contract import PART_NAMESPACE, parse_ingestion_part
from app.modules.ingestion.contract_digest import expected_part_digest
from app.modules.ingestion.models import ContentIngestionReceipt
from app.modules.ingestion.receipt_repository import IngestionReceiptRepository
from app.modules.ingestion.service import ACK_EVENT_TYPE, IngestionApplicationService
from app.modules.outbox.publisher import ContentOutboxRepositoryAdapter, OutboxPublisher
from app.modules.outbox.repository import OutboxRepository
from app.modules.projections.outbox_service import ContentOutboxService

pytestmark = pytest.mark.integration

CONTENT_TOPIC = "parsevk.content.events"
CONTENT_DLQ = "parsevk.content.dlq"
ACK_TOPIC = "parsevk.content.ingestion.vk.ack"
ACK_DLQ = "parsevk.content.ingestion.vk.dlq"


async def _wait_for_postgres(host: str, port: int) -> None:
    last_error = None
    for _ in range(100):
        try:
            connection = await asyncpg.connect(
                host=host,
                port=port,
                user="postgres",
                password="postgres",
                database="postgres",
            )
            await connection.close()
            return
        except (OSError, asyncpg.PostgresError) as exc:
            last_error = exc
            await asyncio.sleep(0.1)
    raise RuntimeError("PostgreSQL test container did not become ready") from last_error


async def _prepare_kafka(bootstrap_servers: str) -> None:
    last_error = None
    for _ in range(100):
        admin = AIOKafkaAdminClient(bootstrap_servers=bootstrap_servers)
        try:
            await admin.start()
            existing = await admin.list_topics()
            topics = (CONTENT_TOPIC, CONTENT_DLQ, ACK_TOPIC, ACK_DLQ)
            missing = [
                NewTopic(name, num_partitions=3, replication_factor=1)
                for name in topics
                if name not in existing
            ]
            if missing:
                await admin.create_topics(missing)
            return
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            await asyncio.sleep(0.2)
        finally:
            await admin.close()
    raise RuntimeError("Kafka test container did not become ready") from last_error


def _comment_part(iteration: int):
    batch_id = uuid4()
    owner_id = -10
    post_id = 2000 + iteration
    comment_id = 7000 + iteration
    part_id = uuid5(PART_NAMESPACE, f"{batch_id}:comments:1:1:1:0")
    source = {
        "kind": "comment_page",
        "ownerId": owner_id,
        "postId": post_id,
        "pageOffset": 0,
        "nextOffset": None,
        "providerMetadata": {},
    }
    comments = [
        {
            "id": comment_id,
            "owner_id": owner_id,
            "post_id": post_id,
            "from_id": 30,
            "date": 1700000000 + iteration,
            "text": "опасный канонический комментарий",
        }
    ]
    authors = [
        {
            "vkAuthorId": 30,
            "type": "user",
            "displayName": "Author",
            "providerData": {"first_name": "A"},
        }
    ]
    payload = {
        "batchId": str(batch_id),
        "partId": str(part_id),
        "partKind": "comments",
        "partIndex": 0,
        "partCount": 1,
        "versions": {"stagingSchema": 1, "packing": 1, "eventContract": 1},
        "source": source,
        "post": {"id": post_id, "owner_id": owner_id, "from_id": 30, "text": "post"},
        "comments": comments,
        "authors": authors,
    }
    event = WireEvent(
        event_id=part_id,
        event_type="vk.ingestion.comment-part-prepared",
        event_version=1,
        aggregate_type="vk_ingestion_batch",
        aggregate_id=str(batch_id),
        correlation_id=f"p3-e2e-{iteration}",
        payload=payload,
        created_at="2026-08-09T00:00:00+00:00",
    )
    raw = event.model_dump_json().encode()
    wire_digest = sha256(raw).hexdigest()
    part_digest = expected_part_digest(
        event,
        source,
        tuple(comments),
        tuple(authors),
        wire_digest,
        len(raw),
    )
    headers = [
        ("event-id", str(part_id).encode()),
        ("event-type", event.event_type.encode()),
        ("source-service", b"vk-service"),
        ("batch-id", str(batch_id).encode()),
        ("wire-digest", wire_digest.encode()),
        ("page-digest", ("a" * 64).encode()),
        ("part-digest", part_digest.encode()),
    ]
    return parse_ingestion_part(raw, headers)


def _application(session) -> IngestionApplicationService:
    return IngestionApplicationService(
        IngestionReceiptRepository(session),
        CanonicalIngestionRepository(session),
        ContentOutboxService(session),
    )


@pytest.mark.asyncio
async def test_canonical_moderation_postgres_kafka_replay_and_crash() -> None:
    postgres = (
        DockerContainer("postgres:16-alpine")
        .with_env("POSTGRES_USER", "postgres")
        .with_env("POSTGRES_PASSWORD", "postgres")
        .with_env("POSTGRES_DB", "postgres")
        .with_exposed_ports(5432)
    )
    kafka = KafkaContainer()
    postgres.start()
    kafka_started = False
    engine = None
    consumer = None
    producer = None
    try:
        kafka.start()
        kafka_started = True
        host = postgres.get_container_host_ip()
        port = int(postgres.get_exposed_port(5432))
        await _wait_for_postgres(host, port)
        bootstrap_servers = kafka.get_bootstrap_server()
        await _prepare_kafka(bootstrap_servers)

        database_url = f"postgresql+asyncpg://postgres:postgres@{host}:{port}/postgres"
        engine = create_async_engine(database_url, pool_pre_ping=True)
        sessions = async_sessionmaker(engine, expire_on_commit=False)
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

        consumer = AIOKafkaConsumer(
            CONTENT_TOPIC,
            bootstrap_servers=bootstrap_servers,
            group_id=f"p3-canonical-moderation-{uuid4()}",
            auto_offset_reset="earliest",
            enable_auto_commit=False,
        )
        producer = AIOKafkaProducer(bootstrap_servers=bootstrap_servers)
        await consumer.start()
        await producer.start()

        repeats = int(os.getenv("P3_CANONICAL_E2E_REPEATS", "1"))
        for iteration in range(repeats):
            part = _comment_part(iteration)

            with pytest.raises(RuntimeError, match="simulated crash"):
                async with sessions() as session:
                    async with session.begin():
                        await _application(session).apply(part)
                        raise RuntimeError("simulated crash")

            async with sessions() as session:
                assert await session.scalar(
                    select(func.count(ContentIngestionReceipt.id)).where(
                        ContentIngestionReceipt.source_message_id == part.source_message_id
                    )
                ) == 0
                assert await session.scalar(
                    select(func.count(ContentOutboxEvent.id)).where(
                        ContentOutboxEvent.dedupe_key.like(
                            f"canonical-comments:{part.source_message_id}:%"
                        )
                    )
                ) == 0
                assert await session.scalar(
                    select(func.count(ProcessedEvent.id)).where(
                        ProcessedEvent.event_id == part.source_message_id
                    )
                ) == 0

            async with sessions() as session:
                async with session.begin():
                    receipt = await _application(session).apply(part)
                    manifest_item = receipt.effect_summary[MANIFEST_KEY]["events"][0]
                    event_id = UUID(manifest_item["eventId"])

            async with sessions() as session:
                canonical_row = await session.get(ContentOutboxEvent, event_id)
                comment = await session.scalar(
                    select(ContentComment).where(
                        ContentComment.vk_comment_id == 7000 + iteration
                    )
                )
                assert canonical_row is not None
                assert comment is not None
                original_envelope = (
                    canonical_row.event_type,
                    canonical_row.event_version,
                    canonical_row.aggregate_type,
                    canonical_row.aggregate_id,
                    canonical_row.correlation_id,
                    canonical_row.dedupe_key,
                    canonical_row.payload,
                    canonical_row.created_at,
                )
                original_comment_updated_at = comment.updated_at

            async with sessions() as session:
                async with session.begin():
                    await session.execute(
                        delete(ContentOutboxEvent).where(ContentOutboxEvent.id == event_id)
                    )

            async with sessions() as session:
                async with session.begin():
                    await _application(session).apply(part)

            async with sessions() as session:
                repaired = await session.get(ContentOutboxEvent, event_id)
                comment = await session.scalar(
                    select(ContentComment).where(
                        ContentComment.vk_comment_id == 7000 + iteration
                    )
                )
                assert repaired is not None
                assert (
                    repaired.event_type,
                    repaired.event_version,
                    repaired.aggregate_type,
                    repaired.aggregate_id,
                    repaired.correlation_id,
                    repaired.dedupe_key,
                    repaired.payload,
                    repaired.created_at,
                ) == original_envelope
                assert comment is not None
                assert comment.updated_at == original_comment_updated_at

            async with sessions() as session:
                async with session.begin():
                    inner = OutboxRepository(session)
                    publisher = OutboxPublisher(
                        repository=ContentOutboxRepositoryAdapter(inner),
                        producer=producer,
                        topic=CONTENT_TOPIC,
                        dlq_topic=CONTENT_DLQ,
                        namespace="content-p3-e2e",
                        topic_fn=lambda message: (
                            ACK_TOPIC if message.event_type == ACK_EVENT_TYPE else CONTENT_TOPIC
                        ),
                        dlq_topic_fn=lambda message: (
                            ACK_DLQ if message.event_type == ACK_EVENT_TYPE else CONTENT_DLQ
                        ),
                    )
                    await publisher.publish_batch(limit=100)

            record = await asyncio.wait_for(consumer.getone(), timeout=10)
            wire = WireEvent.model_validate_json(record.value)
            assert wire.event_id == event_id
            assert wire.event_type == CANONICAL_COMMENTS_EVENT_TYPE
            assert wire.payload == manifest_item["payload"]

            async with sessions() as session:
                rows = list(
                    await session.scalars(
                        select(ContentOutboxEvent).where(
                            ContentOutboxEvent.dedupe_key == manifest_item["dedupeKey"]
                        )
                    )
                )
                assert len(rows) == 1
                assert rows[0].status == "published"
    finally:
        if consumer is not None:
            await consumer.stop()
        if producer is not None:
            await producer.stop()
        if engine is not None:
            await engine.dispose()
        if kafka_started:
            kafka.stop()
        postgres.stop()
