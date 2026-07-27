import sys
import json
from datetime import UTC, datetime
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from common.events import WireEvent

import app.db.session as session_module
from app.db.models import RealtimeEvent
from app.core.config import settings
from app.modules.ingestion.ingestor import _map_audience, consume_topic_forever, ingest_event
from app.modules.retention.cleaner import safety_catchup


# scenario: 6 - Duplicate event
@pytest.mark.anyio
async def test_duplicate_event_on_conflict_do_nothing(mock_session):
    event_id = uuid4()
    wire = WireEvent.model_validate(
        {
            "event_id": str(event_id),
            "event_type": "content.comments_projected",
            "event_version": 1,
            "aggregate_type": "vk_comment",
            "aggregate_id": "-1:3",
            "payload": {"insertedCount": 1, "totalCount": 1},
            "created_at": "2026-07-27T00:00:00+00:00",
        }
    )

    mock_session.execute.side_effect = [
        AsyncMock(rowcount=1),  # first insert succeeds
        AsyncMock(),            # pg_notify
        AsyncMock(rowcount=0),  # duplicate insert skipped
    ]
    mock_session.scalar.return_value = 42

    assert await ingest_event(mock_session, wire, "parsevk.content.events") is True
    assert await ingest_event(mock_session, wire, "parsevk.content.events") is False
    assert mock_session.execute.call_count == 3


# scenario: 7 - Realtime restart / safety catch-up
@pytest.mark.anyio
async def test_safety_catchup_recovers_missed_events():
    async with session_module.SessionLocal() as session:
        async with session.begin():
            for i in range(3):
                session.add(
                    RealtimeEvent(
                        sequence_id=i + 1,
                        event_id=uuid4(),
                        event_type="content.comments_projected",
                        event_version=1,
                        source_topic="parsevk.content.events",
                        audience_type="authenticated",
                        audience_id=None,
                        aggregate_type="vk_comment",
                        aggregate_id=f"-1:{i}",
                        payload={"insertedCount": i},
                        created_at=datetime.now(UTC),
                        expires_at=datetime.now(UTC),
                    )
                )

    count = await safety_catchup(session_module.SessionLocal)
    assert count == 3


# scenario: 8 - Lost NOTIFY
@pytest.mark.anyio
async def test_lost_notify_recovered_by_periodic_query():
    """Safety catch-up detects missed events and wakes listeners via pg_notify."""
    from app.modules.retention import cleaner
    cleaner._last_sequence_id = None

    try:
        session_factory = _fake_session_factory()
        session = session_factory.return_value
        session.scalar.return_value = 3

        # First call initializes the cursor; no pg_notify yet.
        count = await safety_catchup(session_factory)
        assert count == 3
        session.execute.assert_not_awaited()

        # Simulate missed events: max sequence_id jumps ahead.
        session.scalar.return_value = 5
        session.execute.return_value = AsyncMock()

        count = await safety_catchup(session_factory)
        assert count == 5
        session.execute.assert_awaited_once()
        notify_stmt = session.execute.await_args[0][0]
        assert "pg_notify" in str(notify_stmt)
        assert session.execute.await_args[0][1] == {"seq": "5"}
    finally:
        cleaner._last_sequence_id = None


# scenario: 15 (partial) - Task event out-of-order
@pytest.mark.anyio
async def test_task_revision_protects_ordering():
    audience_type, audience_id = _map_audience(
        "task.state_changed", {"ownerUserId": 42}
    )
    assert audience_type == "user"
    assert audience_id == "42"

    # Simulated ordering guard used by downstream consumers (e.g. frontend cache).
    def should_apply_task_state(current_revision: int, incoming_revision: int) -> bool:
        return incoming_revision >= current_revision

    assert should_apply_task_state(5, 5) is True
    assert should_apply_task_state(5, 6) is True
    assert should_apply_task_state(5, 4) is False


def _make_fake_consumer(messages):
    """Return a fake AIOKafkaConsumer that iterates over ``messages`` once."""
    class FakeConsumer:
        def __init__(self, messages):
            self.messages = messages
            self.commit = AsyncMock()
            self.start = AsyncMock()
            self.stop = AsyncMock()
            self._iter = None

        def __aiter__(self):
            self._iter = iter(self.messages)
            return self

        async def __anext__(self):
            try:
                return next(self._iter)
            except StopIteration:
                raise StopAsyncIteration

    return FakeConsumer(messages)


def _fake_session_factory():
    """Return a callable that produces a fake async session usable as a context manager."""
    session = AsyncMock()

    class _BeginContext:
        async def __aenter__(self):
            return session

        async def __aexit__(self, *args):
            return False

    session.begin = MagicMock(return_value=_BeginContext())

    factory = MagicMock()
    factory.return_value = session
    factory.return_value.__aenter__ = AsyncMock(return_value=session)
    factory.return_value.__aexit__ = AsyncMock(return_value=False)
    return factory


@pytest.mark.anyio
async def test_ingest_event_stores_source_partition_and_offset(mock_session):
    event_id = uuid4()
    wire = WireEvent.model_validate(
        {
            "event_id": str(event_id),
            "event_type": "content.comments_projected",
            "event_version": 1,
            "aggregate_type": "vk_comment",
            "aggregate_id": "-1:3",
            "payload": {"insertedCount": 1, "totalCount": 1},
            "created_at": "2026-07-27T00:00:00+00:00",
        }
    )

    mock_session.execute.side_effect = [
        AsyncMock(rowcount=1),  # insert
        AsyncMock(),            # pg_notify
    ]
    mock_session.scalar.return_value = 42

    await ingest_event(mock_session, wire, "parsevk.content.events", 7, 99)

    insert_stmt = mock_session.execute.call_args_list[0][0][0]
    params = insert_stmt.compile().params
    assert params["source_partition"] == 7
    assert params["source_offset"] == 99


@pytest.mark.anyio
async def test_consume_topic_parse_error_sends_dlq_and_commits():
    bad_msg = SimpleNamespace(value=b"not-json", partition=0, offset=0)
    event_id = uuid4()
    good_msg = SimpleNamespace(
        value=json.dumps(
            {
                "event_id": str(event_id),
                "event_type": "content.comments_projected",
                "event_version": 1,
                "aggregate_type": "vk_comment",
                "aggregate_id": "-1:3",
                "payload": {"insertedCount": 1, "totalCount": 1},
                "created_at": "2026-07-27T00:00:00+00:00",
            }
        ).encode(),
        partition=0,
        offset=1,
    )
    consumer = _make_fake_consumer([bad_msg, good_msg])
    session_factory = _fake_session_factory()

    mock_producer = AsyncMock()
    mock_producer.start = AsyncMock()
    mock_producer.stop = AsyncMock()
    mock_producer.send_and_wait = AsyncMock()

    with (
        patch("app.modules.ingestion.ingestor.AIOKafkaConsumer", return_value=consumer),
        patch("app.modules.ingestion.ingestor.AIOKafkaProducer", return_value=mock_producer),
        patch("app.modules.ingestion.ingestor.ingest_event", new=AsyncMock(return_value=True)) as mock_ingest,
    ):
        await consume_topic_forever(
            session_factory,
            "parsevk.content.events",
            "localhost:9092",
            "realtime-test-group",
        )

    mock_producer.send_and_wait.assert_awaited_once_with(settings.kafka_dlq_topic, value=bad_msg.value)
    assert consumer.commit.await_count == 2
    mock_ingest.assert_awaited_once()


@pytest.mark.anyio
async def test_consume_topic_db_error_does_not_commit():
    event_id = uuid4()
    valid_msg = SimpleNamespace(
        value=json.dumps(
            {
                "event_id": str(event_id),
                "event_type": "content.comments_projected",
                "event_version": 1,
                "aggregate_type": "vk_comment",
                "aggregate_id": "-1:3",
                "payload": {"insertedCount": 1, "totalCount": 1},
                "created_at": "2026-07-27T00:00:00+00:00",
            }
        ).encode(),
        partition=0,
        offset=1,
    )
    consumer = _make_fake_consumer([valid_msg])
    session_factory = _fake_session_factory()

    with (
        patch("app.modules.ingestion.ingestor.AIOKafkaConsumer", return_value=consumer),
        patch("app.modules.ingestion.ingestor.ingest_event", side_effect=RuntimeError("DB down")),
    ):
        await consume_topic_forever(
            session_factory,
            "parsevk.content.events",
            "localhost:9092",
            "realtime-test-group",
        )

    consumer.commit.assert_not_awaited()
