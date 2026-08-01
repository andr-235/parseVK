from unittest.mock import AsyncMock

import pytest

from app.modules.outbox.service import OutboxService


@pytest.mark.asyncio
async def test_resume_attempts_get_distinct_stored_dedupe_keys():
    session = AsyncMock()
    service = OutboxService(session)

    common = {
        "event_type": "task.resumed",
        "aggregate_type": "task",
        "aggregate_id": "42",
        "dedupe_key": "task.resumed:42:run-1",
        "payload": {"taskId": "42", "runId": "run-1"},
    }

    await service.add_event(**common)
    await service.add_event(**common)

    first = session.execute.await_args_list[0].args[0].compile().params
    second = session.execute.await_args_list[1].args[0].compile().params

    assert first["dedupe_key"].startswith("task.resumed:42:run-1:")
    assert second["dedupe_key"].startswith("task.resumed:42:run-1:")
    assert first["dedupe_key"] != second["dedupe_key"]
