import json
import sys
from pathlib import Path
from uuid import uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.modules.tasks.consumer import TaskEventsConsumer


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_handle_processing_failure_sends_to_dlq_on_malformed_msg():
    from unittest.mock import AsyncMock, patch

    consumer = TaskEventsConsumer(session_factory=AsyncMock(), tasks_client=AsyncMock())
    consumer._consumer = AsyncMock()

    msg = AsyncMock()
    msg.value = b"not valid json{{{"
    msg.offset = 42

    with patch("common.kafka.consumer_retry.send_to_dlq", new_callable=AsyncMock) as mock_send:
        await consumer._retry.handle_failure(
            msg,
            ValueError("invalid JSON"),
            consumer._consumer,
        )
        mock_send.assert_awaited_once()

    consumer._consumer.commit.assert_awaited_once()


@pytest.mark.anyio
async def test_skip_due_to_retry_backoff_preserves_offset_when_in_backoff():
    from datetime import UTC, datetime, timedelta
    from types import SimpleNamespace
    from unittest.mock import AsyncMock

    consumer = TaskEventsConsumer(session_factory=AsyncMock(), tasks_client=AsyncMock())
    consumer._consumer = AsyncMock()

    raw_value = json.dumps(
        {
            "event_id": str(uuid4()),
            "event_type": "task.created",
        }
    ).encode()

    row = SimpleNamespace(
        next_retry_at=datetime.now(UTC) + timedelta(hours=1),
        retry_count=1,
    )

    async def scalar_mock(*a, **kw):
        return row

    session = AsyncMock()
    session.scalar = scalar_mock
    session.__aenter__ = AsyncMock(return_value=session)

    consumer._retry.session_factory = lambda: session
    consumer._retry.repository.get_event = AsyncMock(return_value=row)

    result = await consumer._retry.skip_due_to_backoff(
        raw_value,
        consumer._consumer,
    )

    assert result is True
    consumer._consumer.commit.assert_not_awaited()
