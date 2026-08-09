from datetime import UTC, datetime

import pytest
from _part_publisher_test_support import RecordingTransport, build_publisher
from _staged_part_publisher_fixtures import (
    seed_publishable_comment_parts,
    seed_publishable_post,
)
from sqlalchemy import select

from app.domain.entities.ingestion_part_identity import IngestionPartVersions
from app.infrastructure.db.models.ingestion_part_publication import (
    VkIngestionPartReference,
)
from app.infrastructure.db.models.ingestion_parts import VkIngestionStagingPart
from app.infrastructure.db.models.ingestion_staging import VkIngestionStagingBatch
from app.infrastructure.db.session import SessionLocal

pytestmark = pytest.mark.anyio


async def _seed(*, versions: IngestionPartVersions = IngestionPartVersions()):
    async with SessionLocal.begin() as session:
        return await seed_publishable_post(session, versions=versions)


async def test_transient_broker_failure_releases_claim_for_retry(db_session) -> None:
    seeded = await _seed()
    now = datetime.now(UTC)
    transport = RecordingTransport(RuntimeError("broker unavailable"))

    result = await build_publisher(transport, now=now).publish_once()

    assert result.claimed == result.retried == 1
    async with SessionLocal() as session:
        reference = await session.get(
            VkIngestionPartReference,
            seeded.part.message_id,
        )
        part = await session.get(VkIngestionStagingPart, seeded.part.message_id)
        batch = await session.get(VkIngestionStagingBatch, seeded.batch_id)
    assert reference is not None
    assert reference.status == "pending" and reference.claim_id is None
    assert reference.attempts == 1
    assert reference.last_error == "broker unavailable"
    assert _as_utc(reference.next_attempt_at) > now
    assert part is not None and part.status == "prepared"
    assert batch is not None and batch.status == "prepared"


async def test_max_attempt_failure_terminates_entire_batch(db_session) -> None:
    seeded = await _seed()
    now = datetime.now(UTC)
    transport = RecordingTransport(RuntimeError("broker rejected message"))

    result = await build_publisher(
        transport,
        now=now,
        max_attempts=1,
    ).publish_once()

    assert result.claimed == result.failed == 1
    async with SessionLocal() as session:
        reference = await session.get(
            VkIngestionPartReference,
            seeded.part.message_id,
        )
        part = await session.get(VkIngestionStagingPart, seeded.part.message_id)
        batch = await session.get(VkIngestionStagingBatch, seeded.batch_id)
    assert reference is not None and reference.status == "failed"
    assert _as_utc(reference.failed_at) == now
    assert reference.last_error == "broker rejected message"
    assert part is not None and part.status == "failed"
    assert batch is not None and batch.status == "failed"


async def test_terminal_batch_does_not_send_stale_sibling_claim(db_session) -> None:
    async with SessionLocal.begin() as session:
        seeded = await seed_publishable_comment_parts(session)
    transport = RecordingTransport(RuntimeError("broker rejected message"))

    result = await build_publisher(
        transport,
        now=datetime.now(UTC),
        max_attempts=1,
    ).publish_once()

    assert len(seeded.parts) == 2
    assert result.claimed == result.failed == 1
    assert len(transport.calls) == 1
    async with SessionLocal() as session:
        statuses = (
            await session.scalars(
                select(VkIngestionPartReference.status).where(
                    VkIngestionPartReference.part_id.in_(
                        [part.message_id for part in seeded.parts]
                    )
                )
            )
        ).all()
    assert statuses.count("failed") == 2


async def test_empty_transport_error_uses_exception_name(db_session) -> None:
    seeded = await _seed()
    transport = RecordingTransport(TimeoutError())

    result = await build_publisher(
        transport,
        now=datetime.now(UTC),
        max_attempts=1,
    ).publish_once()

    assert result.claimed == result.failed == 1
    async with SessionLocal() as session:
        reference = await session.get(
            VkIngestionPartReference,
            seeded.part.message_id,
        )
    assert reference is not None and reference.last_error == "TimeoutError"


async def test_unsupported_version_is_quarantined_without_send(db_session) -> None:
    versions = IngestionPartVersions(packing=2)
    seeded = await _seed(versions=versions)
    now = datetime.now(UTC)
    transport = RecordingTransport()

    result = await build_publisher(transport, now=now).publish_once()

    assert result.claimed == result.quarantined == 1
    assert transport.calls == []
    async with SessionLocal() as session:
        reference = await session.get(
            VkIngestionPartReference,
            seeded.part.message_id,
        )
        part = await session.get(VkIngestionStagingPart, seeded.part.message_id)
        batch = await session.get(VkIngestionStagingBatch, seeded.batch_id)
    assert reference is not None and reference.status == "quarantined"
    assert _as_utc(reference.quarantined_at) == now
    assert "unsupported ingestion part version tuple" in reference.last_error
    assert part is not None and part.status == "quarantined"
    assert batch is not None and batch.status == "quarantined"


def _as_utc(value: datetime | None) -> datetime:
    assert value is not None
    return value if value.tzinfo is not None else value.replace(tzinfo=UTC)
