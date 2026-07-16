import asyncio
from types import SimpleNamespace

import pytest
from app.tasks.task_worker import TaskWorker
from common.runtime import WorkerHealth


class FakeLeaseStore:
    def __init__(self, count: int):
        self.queue = [SimpleNamespace(task_id=index) for index in range(count)]

    async def claim(self, **_kwargs):
        return self.queue.pop(0) if self.queue else None


@pytest.mark.anyio
async def test_worker_enforces_configured_concurrency():
    gate = asyncio.Event()
    active = 0
    max_active = 0

    class Executor:
        async def execute(self, _task_run):
            nonlocal active, max_active
            active += 1
            max_active = max(max_active, active)
            try:
                await gate.wait()
            finally:
                active -= 1

    store = FakeLeaseStore(3)
    worker = TaskWorker(
        lease_store=store,
        executor_factory=lambda _worker_id: Executor(),
        concurrency=2,
        poll_seconds=0.01,
        lease_seconds=60,
        health=WorkerHealth(),
    )

    assert await worker._fill_capacity()
    await asyncio.sleep(0)

    assert len(worker._active) == 2
    assert len(store.queue) == 1
    assert max_active == 2

    gate.set()
    await asyncio.gather(*worker._active)
