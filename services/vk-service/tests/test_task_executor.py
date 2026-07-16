import asyncio

import httpx
import pytest
from app.services.ingestion.result import IngestionResult
from task_executor_fakes import FakeLeaseStore, FakeTasksClient, build_executor, task_run


@pytest.mark.anyio
async def test_executor_completes_frozen_task_via_repository():
    class Service:
        async def execute(self, _task_run, **_kwargs):
            return IngestionResult(groups=1, posts=2, comments=3)

    leases = FakeLeaseStore()
    client = FakeTasksClient()
    run = task_run()

    await build_executor(Service(), leases, client).execute(run)

    assert run.status == "running"
    done = next(call for call in leases.calls if call[0] == "done")
    assert done[1]["processed_items"] == 6


@pytest.mark.anyio
async def test_executor_times_out_and_fails_task():
    class Service:
        async def execute(self, _task_run, **_kwargs):
            await asyncio.sleep(10)

    leases = FakeLeaseStore()
    client = FakeTasksClient()

    await build_executor(Service(), leases, client, timeout_seconds=0.02).execute(task_run())

    assert any(call[0] == "fail" for call in client.calls)
    assert any(call[0] == "failed" for call in leases.calls)


@pytest.mark.anyio
async def test_executor_cancels_work_when_lease_is_lost():
    cancelled = asyncio.Event()

    class Service:
        async def execute(self, _task_run, **_kwargs):
            try:
                await asyncio.sleep(10)
            finally:
                cancelled.set()

    leases = FakeLeaseStore(renew=False)
    client = FakeTasksClient()

    await build_executor(Service(), leases, client).execute(task_run())

    assert cancelled.is_set()
    assert not any(call[0] == "failed" for call in leases.calls)


@pytest.mark.anyio
async def test_executor_stops_after_max_recovery_attempts():
    leases = FakeLeaseStore()
    client = FakeTasksClient()

    await build_executor(object(), leases, client).execute(task_run(attempts=4))

    assert not any(call[0] == "start" for call in client.calls)
    assert any(call[0] == "failed" for call in leases.calls)


@pytest.mark.anyio
async def test_exhausted_task_becomes_terminal_when_callback_is_unavailable():
    class UnavailableTasksClient(FakeTasksClient):
        async def fail_execution(self, *args, **kwargs):
            request = httpx.Request("POST", "http://tasks/execution/fail")
            raise httpx.ConnectError("unavailable", request=request)

    leases = FakeLeaseStore()
    client = UnavailableTasksClient()

    await build_executor(object(), leases, client).execute(task_run(attempts=4))

    assert any(call[0] == "failed" for call in leases.calls)
    assert not any(call[0] == "release" for call in leases.calls)
