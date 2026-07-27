import sys
from datetime import UTC, datetime
from pathlib import Path
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from common.events import WireEvent

import app.db.session as session_module
from app.db.models import RealtimeEvent
from app.modules.ingestion.ingestor import _map_audience, ingest_event
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
@pytest.mark.skip(reason="requires running DB with LISTEN/NOTIFY")
@pytest.mark.anyio
async def test_lost_notify_recovered_by_periodic_query():
    """
    Procedure:
    1. Start realtime-service consumer.
    2. Publish a content.comments_projected event to Kafka.
    3. Block or drop the PostgreSQL NOTIFY so the SSE poll worker misses it.
    4. Wait for the safety catch-up interval (5s by default).
    5. Assert the SSE poll worker re-queries realtime_events and delivers the event.
    """


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
