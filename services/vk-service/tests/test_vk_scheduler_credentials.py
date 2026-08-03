import asyncio
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.core.config import Settings
from app.domain.exceptions.vk_api import VkApiAuthError
from app.services.vk_retry_policy import VkRetryPolicy
from app.services.vk_scheduler import FairScheduler


def _scheduler() -> FairScheduler:
    settings = Settings(
        vk_token="x",
        target_requests_per_second=1000.0,
        rate_limit_max_retries=0,
        retry_max_elapsed_seconds=30.0,
        short_backoff_base_seconds=1.0,
        account_cooldown_seconds=30,
        hard_limit_cooldown_seconds=300,
    )
    return FairScheduler(VkRetryPolicy(settings))


def _versioned(call, version: str):
    call.credential_version = version
    return call


@pytest.mark.anyio
async def test_auth_failure_blocks_queued_calls_for_same_credential_only():
    scheduler = _scheduler()
    calls = []

    async def auth_failure():
        calls.append("auth")
        raise VkApiAuthError(5, "token expired", "users.get")

    async def stale_queued_call():
        calls.append("stale")
        return "must-not-run"

    first, second = await asyncio.gather(
        scheduler.execute(
            "system-vk",
            "A",
            _versioned(auth_failure, "credential-v1"),
        ),
        scheduler.execute(
            "system-vk",
            "B",
            _versioned(stale_queued_call, "credential-v1"),
        ),
        return_exceptions=True,
    )

    assert isinstance(first, VkApiAuthError)
    assert isinstance(second, VkApiAuthError)
    assert calls == ["auth"]

    async def rotated_call():
        calls.append("rotated")
        return "ok"

    result = await scheduler.execute(
        "system-vk",
        "C",
        _versioned(rotated_call, "credential-v2"),
    )

    assert result == "ok"
    assert calls == ["auth", "rotated"]
    await scheduler.close()
