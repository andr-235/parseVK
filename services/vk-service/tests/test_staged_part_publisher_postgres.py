from datetime import UTC, datetime, timedelta

import pytest
from _ingestion_staging_postgres import staging_postgres
from _part_publisher_test_support import RecordingTransport, build_publisher
from _staged_part_publisher_fixtures import seed_publishable_post

from app.infrastructure.db.models.ingestion_part_publication import (
    VkIngestionPartReference,
)

pytestmark = [pytest.mark.anyio, pytest.mark.integration]


class _CrashAfterAck:
    def __init__(self, delegate) -> None:
        self.delegate = delegate

    async def claim(self, **kwargs):
        return await self.delegate.claim(**kwargs)

    async def published(self, *_args, **_kwargs) -> None:
        raise RuntimeError("crash after broker acknowledgement")

    def __getattr__(self, name):
        return getattr(self.delegate, name)


async def test_post_ack_crash_replays_identical_id_and_bytes_on_postgres() -> None:
    async with staging_postgres() as (session_factory, execution, attempts):
        attempt = attempts[0]
        async with session_factory.begin() as session:
            seeded = await seed_publishable_post(
                session,
                execution_id=execution.id,
                attempt_id=attempt.id,
                fencing_token=attempt.fencing_token,
                add_execution=False,
            )

        transport = RecordingTransport()
        first_now = datetime.now(UTC)
        crashed = build_publisher(
            transport,
            now=first_now,
            session_factory=session_factory,
        )
        crashed.state = _CrashAfterAck(crashed.state)

        with pytest.raises(RuntimeError, match="after broker acknowledgement"):
            await crashed.publish_once()

        async with session_factory.begin() as session:
            reference = await session.get(
                VkIngestionPartReference,
                seeded.part.message_id,
            )
            assert reference is not None
            assert reference.status == "pending"
            assert reference.claim_id is not None
            reference.claim_expires_at = datetime.now(UTC) - timedelta(seconds=1)

        result = await build_publisher(
            transport,
            now=first_now + timedelta(seconds=1),
            session_factory=session_factory,
        ).publish_once()

        assert result.published == 1
        assert len(transport.calls) == 2
        assert transport.calls[0] == transport.calls[1]
        assert transport.calls[1]["value"] == seeded.part.wire_bytes
        assert dict(transport.calls[1]["headers"])["event-id"] == str(
            seeded.part.message_id
        ).encode()
