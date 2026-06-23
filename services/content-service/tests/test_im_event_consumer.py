import json
import sys
from pathlib import Path
from uuid import uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_handle_processing_failure_sends_to_dlq_on_malformed_msg():
    from unittest.mock import AsyncMock, patch
    from app.modules.im_events.consumer import ImEventConsumer

    consumer = ImEventConsumer(session_factory=AsyncMock())
    consumer._consumer = AsyncMock()

    msg = AsyncMock()
    msg.value = b"not valid json{{{"
    msg.offset = 42

    with patch("common.kafka.consumer.send_to_dlq", new_callable=AsyncMock) as mock_send:
        await consumer._handle_processing_failure(msg)
        mock_send.assert_awaited_once()

    consumer._consumer.commit.assert_awaited_once()


@pytest.mark.anyio
async def test_skip_due_to_retry_backoff_commits_offset_when_in_backoff():
    from unittest.mock import AsyncMock
    from types import SimpleNamespace
    from json import dumps
    from uuid import uuid4
    from datetime import UTC, datetime, timedelta
    from app.modules.im_events.consumer import ImEventConsumer

    consumer = ImEventConsumer()
    consumer._consumer = AsyncMock()

    raw_value = dumps({
        "event_id": str(uuid4()),
        "event_type": "im.message_collected",
    }).encode()

    row = SimpleNamespace(
        next_retry_at=datetime.now(UTC) + timedelta(hours=1),
        retry_count=1,
    )

    async def scalar_mock(*a, **kw):
        return row

    session = AsyncMock()
    session.scalar = scalar_mock
    session.__aenter__ = AsyncMock(return_value=session)

    consumer.session_factory = lambda: session

    result = await consumer._skip_due_to_retry_backoff(raw_value)

    assert result is True
    consumer._consumer.commit.assert_awaited_once()
