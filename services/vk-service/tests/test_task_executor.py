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
async def test_exhausted_task_retries_when_callback_is_unavailable():
    class UnavailableTasksClient(FakeTasksClient):
        async def fail_execution(self, *args, **kwargs):
            request = httpx.Request("POST", "http://tasks/execution/fail")
            raise httpx.ConnectError("unavailable", request=request)

    leases = FakeLeaseStore()
    client = UnavailableTasksClient()

    await build_executor(object(), leases, client).execute(task_run(attempts=4))

    assert any(call[0] == "release" for call in leases.calls)
    assert not any(call[0] == "failed" for call in leases.calls)


@pytest.mark.anyio
async def test_remote_done_recreates_completion_event_before_marking_local_done():
    class Outbox:
        def __init__(self):
            self.calls = []

        async def emit_task_completed(self, **kwargs):
            self.calls.append(kwargs)

    class Service:
        outbox = Outbox()

    class DoneTasksClient(FakeTasksClient):
        async def start_execution(self, *args, **kwargs):
            self.calls.append(("start", args, kwargs))
            return {"status": "done", "processedItems": 6, "totalItems": 6, "stats": {"posts": 2}}

    service = Service()
    leases = FakeLeaseStore()

    await build_executor(service, leases, DoneTasksClient()).execute(task_run())

    assert service.outbox.calls == [
        {
            "task_id": 10,
            "run_id": "run-10",
            "stats": {"posts": 2},
            "correlation_id": "run-10",
        }
    ]
    assert any(call[0] == "done" for call in leases.calls)


@pytest.mark.anyio
async def test_remote_done_is_retried_when_completion_event_cannot_be_recorded():
    class Outbox:
        async def emit_task_completed(self, **_kwargs):
            raise RuntimeError("database unavailable")

    class Service:
        outbox = Outbox()

    class DoneTasksClient(FakeTasksClient):
        async def start_execution(self, *_args, **_kwargs):
            return {"status": "done"}

    leases = FakeLeaseStore()

    await build_executor(Service(), leases, DoneTasksClient()).execute(task_run())

    assert any(call[0] == "release" for call in leases.calls)
    assert not any(call[0] == "done" for call in leases.calls)
