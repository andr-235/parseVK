import asyncio
from types import SimpleNamespace

import pytest
from common.runtime import WorkerHealth

from app.tasks.execution_worker import ExecutionWorker


class FakeExecutionStore:
    def __init__(self, count: int):
        self.queue = [SimpleNamespace(execution_id=index) for index in range(count)]

    async def claim(self, **_kwargs):
        return self.queue.pop(0) if self.queue else None


class BlockingGate:
    def __init__(self, allowed: bool = True):
        self.allowed = allowed
        self.checks = 0

    async def can_claim(self) -> bool:
        self.checks += 1
        return self.allowed


@pytest.mark.anyio
async def test_worker_enforces_configured_concurrency():
    gate = asyncio.Event()
    active = 0
    max_active = 0

    class Executor:
        async def execute(self, _claim):
            nonlocal active, max_active
            active += 1
            max_active = max(max_active, active)
            try:
                await gate.wait()
            finally:
                active -= 1

    store = FakeExecutionStore(3)
    worker = ExecutionWorker(
        execution_store=store,
        executor_factory=lambda _worker_id: Executor(),
        concurrency=2,
        poll_seconds=0.01,
        lease_seconds=60,
        shutdown_grace_seconds=0.1,
        health=WorkerHealth(),
    )

    assert await worker._fill_capacity()
    await asyncio.sleep(0)

    assert len(worker._active) == 2
    assert len(store.queue) == 1
    assert max_active == 2

    gate.set()
    await asyncio.gather(*worker._active)


@pytest.mark.anyio
async def test_worker_stops_claiming_when_provider_gate_blocks():
    store = FakeExecutionStore(3)
    account_gate = BlockingGate(allowed=False)
    worker = ExecutionWorker(
        execution_store=store,
        executor_factory=lambda _worker_id: object(),
        concurrency=2,
        poll_seconds=0.01,
        lease_seconds=60,
        shutdown_grace_seconds=0.1,
        health=WorkerHealth(),
        account_gate=account_gate,
    )

    assert await worker._fill_capacity() is False
    assert account_gate.checks == 1
    assert len(store.queue) == 3


@pytest.mark.anyio
async def test_shutdown_cancels_attempt_after_grace_period():
    cancelled = asyncio.Event()

    class Executor:
        async def execute(self, _claim):
            try:
                await asyncio.sleep(10)
            finally:
                cancelled.set()

    store = FakeExecutionStore(1)
    worker = ExecutionWorker(
        execution_store=store,
        executor_factory=lambda _worker_id: Executor(),
        concurrency=1,
        poll_seconds=0.01,
        lease_seconds=60,
        shutdown_grace_seconds=0,
        health=WorkerHealth(),
    )
    await worker._fill_capacity()

    task = asyncio.create_task(worker.run_forever())
    await asyncio.sleep(0)
    task.cancel()
    await asyncio.gather(task, return_exceptions=True)

    assert cancelled.is_set()
