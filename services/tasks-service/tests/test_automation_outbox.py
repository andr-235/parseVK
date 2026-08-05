from unittest.mock import AsyncMock, MagicMock

import pytest

from app.bootstrap import ApplicationFactory
from app.modules.automation.schemas import AutomationSettingsUpdate


@pytest.mark.anyio
async def test_automation_settings_update_produces_two_events():
    service = ApplicationFactory(AsyncMock()).create_automation_service()
    settings = MagicMock(
        enabled=False,
        run_hour=10,
        run_minute=0,
        post_limit=10,
        timezone_offset_minutes=0,
        last_run_at=None,
    )
    service.repository.get_or_create_settings = AsyncMock(return_value=settings)
    service.tasks.add_audit = AsyncMock()
    service.outbox.add_event = AsyncMock()
    service._settings_response = AsyncMock(return_value={})

    await service.update_settings(
        "user-1",
        AutomationSettingsUpdate(
            enabled=False,
            runHour=10,
            runMinute=0,
            postLimit=10,
            timezoneOffsetMinutes=0,
        ),
    )
    await service.update_settings(
        "user-1",
        AutomationSettingsUpdate(
            enabled=True,
            runHour=12,
            runMinute=30,
            postLimit=20,
            timezoneOffsetMinutes=60,
        ),
    )

    assert service.outbox.add_event.call_count == 2
    assert all(
        call.kwargs["event_type"] == "task.automation_settings_updated"
        for call in service.outbox.add_event.call_args_list
    )
