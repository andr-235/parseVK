from datetime import UTC, datetime
from unittest.mock import AsyncMock

import pytest
from outbox_test_helpers import make_event

from app.modules.outbox.publisher import MAX_OUTBOX_ATTEMPTS
from app.modules.outbox.repository import OutboxRepository


@pytest.mark.anyio
async def test_mark_failed_applies_backoff_and_keeps_pending():
    event = make_event(
        "00000000-0000-0000-0000-000000000004",
        attempts=1,
    )
    repository = OutboxRepository(AsyncMock())
    before = datetime.now(UTC)

    await repository.mark_failed(
        event,
        "temporary error",
        max_attempts=MAX_OUTBOX_ATTEMPTS,
    )

    assert event.attempts == 2
    assert event.status == "pending"
    assert event.last_error == "temporary error"
    assert event.next_attempt_at > before


@pytest.mark.anyio
async def test_mark_failed_sets_terminal_status_at_max_attempts():
    event = make_event(
        "00000000-0000-0000-0000-000000000004",
        attempts=MAX_OUTBOX_ATTEMPTS - 1,
    )
    repository = OutboxRepository(AsyncMock())

    await repository.mark_failed(
        event,
        "fatal error",
        max_attempts=MAX_OUTBOX_ATTEMPTS,
    )

    assert event.attempts == MAX_OUTBOX_ATTEMPTS
    assert event.status == "failed"
    assert event.last_error == "fatal error"
