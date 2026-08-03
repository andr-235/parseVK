import asyncio
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.tasks.task_run_runner import TaskRunRunner


class FakeSession:
    committed = False
    rolled_back = False

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_args):
        return None

    async def commit(self):
        self.committed = True

    async def rollback(self):
        self.rolled_back = True


class FakeLeaseStore:
    async def renew(self, **_kwargs):
        return True


@pytest.mark.anyio
async def test_async_adapter_factory_is_awaited_before_service_creation():
    adapter = object()
    observed = []

    async def adapter_factory(_session, task_run):
        await asyncio.sleep(0)
        assert task_run.run_id == "run-1"
        return adapter

    class Service:
        async def execute(self, task_run, **_kwargs):
            assert task_run.run_id == "run-1"
            return "done"

    def ingestion_factory(_session, *, adapter):
        observed.append(adapter)
        return Service()

    runner = TaskRunRunner(
        lease_store=FakeLeaseStore(),
        session_factory=FakeSession,
        ingestion_factory=ingestion_factory,
        worker_id="worker-1",
        lease_seconds=30,
        heartbeat_seconds=10,
        timeout_seconds=5,
        adapter_factory=adapter_factory,
    )

    result = await runner.run(SimpleNamespace(task_id=1, run_id="run-1"))

    assert result == "done"
    assert observed == [adapter]
