"""Unit tests for scheduler fairness, rate, retries and cancellation."""

import asyncio
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.core.config import Settings
from app.domain.exceptions.vk_api import VkApiAuthError, VkApiRateLimitError
from app.services.vk_retry_policy import VkRetryPolicy
from app.services.vk_scheduler import FairScheduler
from app.services.vk_scheduler_models import RetryExhaustedError


class FakeClock:
    def __init__(self):
        self.now = 0.0

    def __call__(self):
        return self.now

    def advance(self, seconds):
        self.now += seconds


class FakeSleep:
    def __init__(self, clock: FakeClock):
        self.clock = clock

    async def __call__(self, delay):
        if delay > 0:
            self.clock.advance(delay)
        await asyncio.sleep(0)


def _policy(**overrides) -> VkRetryPolicy:
    defaults = dict(
        vk_token="x",
        target_requests_per_second=3.0,
        rate_limit_max_retries=5,
        retry_max_elapsed_seconds=300.0,
        short_backoff_base_seconds=1.0,
        account_cooldown_seconds=300,
        hard_limit_cooldown_seconds=3600,
    )
    defaults.update(overrides)
    return VkRetryPolicy(Settings(**defaults))


def _scheduler(policy: VkRetryPolicy, clock: FakeClock) -> FairScheduler:
    return FairScheduler(policy, time_fn=clock, sleep_fn=FakeSleep(clock))


async def _call(order: list, marker: str):
    order.append(marker)
    return "ok"


@pytest.mark.anyio
async def test_round_robin_fairness_across_lanes():
    clock = FakeClock()
    scheduler = _scheduler(_policy(), clock)
    order = []

    results = await asyncio.gather(
        scheduler.execute("system-vk", "A", lambda: _call(order, "A1")),
        scheduler.execute("system-vk", "A", lambda: _call(order, "A2")),
        scheduler.execute("system-vk", "B", lambda: _call(order, "B1")),
        scheduler.execute("system-vk", "B", lambda: _call(order, "B2")),
    )

    assert results == ["ok"] * 4
    assert order == ["A1", "B1", "A2", "B2"]


@pytest.mark.anyio
async def test_target_rate_spaces_request_starts():
    clock = FakeClock()
    scheduler = _scheduler(
        _policy(target_requests_per_second=2.0),
        clock,
    )
    starts = []

    async def record_start():
        starts.append(clock())
        return "ok"

    await asyncio.gather(
        scheduler.execute("system-vk", "A", record_start),
        scheduler.execute("system-vk", "B", record_start),
        scheduler.execute("system-vk", "C", record_start),
    )

    assert starts == pytest.approx([0.0, 0.5, 1.0])


@pytest.mark.anyio
async def test_lane_skip_during_backoff():
    clock = FakeClock()
    scheduler = _scheduler(_policy(rate_limit_max_retries=1), clock)
    order = []

    async def failing_a1():
        order.append("A1")
        raise VkApiRateLimitError(9, "overshoot", "users.get")

    async def ok_b1():
        order.append("B1")
        return "ok"

    results = await asyncio.gather(
        scheduler.execute("system-vk", "A", failing_a1),
        scheduler.execute("system-vk", "B", ok_b1),
        return_exceptions=True,
    )

    assert isinstance(results[0], RetryExhaustedError)
    assert results[1] == "ok"
    assert order == ["A1", "B1", "A1"]


@pytest.mark.anyio
async def test_account_cooldown_stops_all_lanes():
    clock = FakeClock()
    scheduler = _scheduler(
        _policy(
            rate_limit_max_retries=5,
            account_cooldown_seconds=300,
            retry_max_elapsed_seconds=3600,
        ),
        clock,
    )
    order = []

    async def flood_call():
        order.append("flood")
        raise VkApiRateLimitError(6, "flood", "wall.get")

    with pytest.raises(RetryExhaustedError):
        await scheduler.execute("system-vk", "A", flood_call)

    assert order == ["flood"] * 6
    assert clock.now >= 1500.0


@pytest.mark.anyio
async def test_retry_budget_exhaustion_raises_typed_failure():
    clock = FakeClock()
    scheduler = _scheduler(_policy(rate_limit_max_retries=2), clock)

    async def always_rate_limited():
        raise VkApiRateLimitError(9, "overshoot", "users.get")

    with pytest.raises(RetryExhaustedError) as exc_info:
        await scheduler.execute("system-vk", "A", always_rate_limited)

    assert exc_info.value.attempts == 2


@pytest.mark.anyio
async def test_max_elapsed_deadline_prevents_late_retry():
    clock = FakeClock()
    scheduler = _scheduler(
        _policy(rate_limit_max_retries=10, retry_max_elapsed_seconds=600),
        clock,
    )

    async def always_rate_limited():
        raise VkApiRateLimitError(6, "flood", "users.get")

    with pytest.raises(RetryExhaustedError) as exc_info:
        await scheduler.execute("system-vk", "A", always_rate_limited)

    assert exc_info.value.attempts == 2
    assert 300 <= clock.now < 600


@pytest.mark.anyio
async def test_auth_error_is_not_retried():
    clock = FakeClock()
    scheduler = _scheduler(_policy(rate_limit_max_retries=5), clock)
    calls = []

    async def auth_failure():
        calls.append(1)
        raise VkApiAuthError(5, "auth failed", "users.get")

    with pytest.raises(VkApiAuthError):
        await scheduler.execute("system-vk", "A", auth_failure)

    assert calls == [1]


@pytest.mark.anyio
async def test_cancelled_queued_request_is_never_executed():
    scheduler = FairScheduler(_policy(target_requests_per_second=1000.0))
    gate = asyncio.Event()
    cancelled_call_started = asyncio.Event()

    async def slow():
        await gate.wait()
        return "slow"

    async def must_not_run():
        cancelled_call_started.set()
        return "bad"

    first = asyncio.create_task(scheduler.execute("system-vk", "A", slow))
    await asyncio.sleep(0)
    second = asyncio.create_task(
        scheduler.execute("system-vk", "B", must_not_run)
    )
    await asyncio.sleep(0)
    second.cancel()
    with pytest.raises(asyncio.CancelledError):
        await second

    gate.set()
    assert await first == "slow"
    await asyncio.sleep(0)
    assert not cancelled_call_started.is_set()
    assert scheduler.queue_depth("system-vk") == 0
    await scheduler.close()


@pytest.mark.anyio
async def test_new_request_restarts_idle_dispatcher():
    clock = FakeClock()
    scheduler = _scheduler(_policy(), clock)
    calls = []

    assert await scheduler.execute(
        "system-vk", "A", lambda: _call(calls, "first")
    ) == "ok"
    await asyncio.sleep(0)
    assert await scheduler.execute(
        "system-vk", "B", lambda: _call(calls, "second")
    ) == "ok"

    assert calls == ["first", "second"]


@pytest.mark.anyio
async def test_close_cancels_in_flight_call():
    scheduler = FairScheduler(_policy())
    started = asyncio.Event()
    cancelled = asyncio.Event()

    async def blocked():
        started.set()
        try:
            await asyncio.Event().wait()
        finally:
            cancelled.set()

    task = asyncio.create_task(
        scheduler.execute("system-vk", "A", blocked)
    )
    await started.wait()
    await scheduler.close()

    with pytest.raises(asyncio.CancelledError):
        await task
    assert cancelled.is_set()


@pytest.mark.anyio
async def test_queue_depth_and_metrics_hook():
    clock = FakeClock()
    scheduler = _scheduler(_policy(), clock)
    metrics = []
    scheduler.metrics_hook = lambda account, method, outcome, wait, dur: metrics.append(
        (account, method, outcome, wait)
    )
    gate = asyncio.Event()

    async def slow():
        await gate.wait()
        return "slow-ok"

    async def quick():
        return "quick-ok"

    first = asyncio.create_task(scheduler.execute("system-vk", "A", slow))
    await asyncio.sleep(0.01)
    second = asyncio.create_task(scheduler.execute("system-vk", "B", quick))
    await asyncio.sleep(0.01)
    assert scheduler.queue_depth("system-vk") == 1

    gate.set()
    assert await first == "slow-ok"
    assert await second == "quick-ok"
    assert metrics[0] == ("system-vk", "vk", "success", 0.0)
    assert metrics[1][:3] == ("system-vk", "vk", "success")
    assert metrics[1][3] == pytest.approx(1 / 3)
