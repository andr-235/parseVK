import asyncio
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.domain.exceptions.vk_api import VkApiAuthError
from app.main import supervise


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_supervise_restarts_until_success():
    call_count = 0
    health_flag = [False]

    async def eventually_ok():
        nonlocal call_count
        call_count += 1
        if call_count < 3:
            raise RuntimeError("transient error")

    await supervise("test", eventually_ok, health_flag=health_flag)

    assert call_count == 3
    assert health_flag[0] is True


@pytest.mark.anyio
async def test_supervise_stops_on_cancelled():
    health_flag = [False]

    async def cancellable():
        raise asyncio.CancelledError()

    await supervise("test", cancellable, health_flag=health_flag)
    assert health_flag[0] is False


@pytest.mark.anyio
async def test_supervise_sets_healthy_on_success():
    health_flag = [False]

    async def success():
        pass

    await supervise("test", success, health_flag=health_flag)
    assert health_flag[0] is True


@pytest.mark.anyio
async def test_supervise_no_health_flag():
    async def ok():
        pass

    await supervise("test", ok)


@pytest.mark.anyio
async def test_supervise_stops_on_vk_auth_error():
    health_flag = [False]

    async def failing():
        raise VkApiAuthError(8, "Application is blocked")

    await supervise("test", failing, health_flag=health_flag)
    assert health_flag[0] is False
