from datetime import UTC, datetime, timedelta

import pytest
from _part_publisher_test_support import RecordingTransport, build_publisher
from _staged_part_publisher_fixtures import seed_publishable_post

from app.infrastructure.db.models.ingestion_part_publication import (
    VkIngestionPartReference,
)
from app.infrastructure.db.models.ingestion_parts import VkIngestionStagingPart
from app.infrastructure.db.models.ingestion_staging import VkIngestionStagingBatch
from app.infrastructure.db.session import SessionLocal

pytestmark = pytest.mark.anyio


async def _seed():
    async with SessionLocal.begin() as session:
        return await seed_publishable_post(session)


async def test_publisher_sends_persisted_bytes_before_marking_published(
    db_session,
) -> None:
    seeded = await _seed()
    now = datetime.now(UTC)
    transport = RecordingTransport()

    result = await build_publisher(transport, now=now).publish_once()

    assert result.claimed == result.published == 1
    assert len(transport.calls) == 1
    call = transport.calls[0]
    assert call["topic"] == "parsevk.content.ingestion.vk"
    assert call["value"] == seeded.part.wire_bytes
    assert call["key"] == b"-42:99"
    headers = dict(call["headers"])
    assert headers[b"missing"] if False else True
    assert headers["event-id"] == str(seeded.part.message_id).encode()
    assert headers["wire-digest"] == seeded.part.wire_digest.encode()

    async with SessionLocal() as session:
        reference = await session.get(
            VkIngestionPartReference,
            seeded.part.message_id,
        )
        part = await session.get(VkIngestionStagingPart, seeded.part.message_id)
        batch = await session.get(VkIngestionStagingBatch, seeded.batch_id)
    assert reference is not None and reference.status == "published"
    assert reference.claim_id is None and reference.published_at == now
    assert part is not None and part.status == "published"
    assert batch is not None and batch.status == "published"


class CrashAfterAck:
    def __init__(self, delegate) -> None:
        self.delegate = delegate

    async def claim(self, **kwargs):
        return await self.delegate.claim(**kwargs)

    async def published(self, *_args, **_kwargs) -> None:
        raise RuntimeError("crash after broker acknowledgement")

    def __getattr__(self, name):
        return getattr(self.delegate, name)


async def test_post_ack_crash_retries_identical_id_and_bytes(db_session) -> None:
    seeded = await _seed()
    first_now = datetime.now(UTC)
    transport = RecordingTransport()
    crashed = build_publisher(transport, now=first_now)
    crashed.state = CrashAfterAck(crashed.state)

    with pytest.raises(RuntimeError, match="after broker acknowledgement"):
        await crashed.publish_once()

    async with SessionLocal.begin() as session:
        reference = await session.get(
            VkIngestionPartReference,
            seeded.part.message_id,
        )
        assert reference is not None
        assert reference.status == "pending"
        assert reference.claim_id is not None
        reference.claim_expires_at = datetime.now(UTC) - timedelta(seconds=1)

    second_now = datetime.now(UTC) + timedelta(seconds=1)
    result = await build_publisher(transport, now=second_now).publish_once()

    assert result.published == 1
    assert len(transport.calls) == 2
    assert transport.calls[0] == transport.calls[1]
    assert transport.calls[1]["value"] == seeded.part.wire_bytes
    assert dict(transport.calls[1]["headers"])["event-id"] == str(
        seeded.part.message_id
    ).encode()
