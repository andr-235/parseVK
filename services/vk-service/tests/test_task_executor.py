import asyncio

import pytest
from task_executor_fakes import FakeLeaseStore, build_executor, task_run

from app.services.ingestion.result import IngestionResult


@pytest.mark.anyio
async def test_executor_completes_frozen_task_via_repository():
    class Service:
        async def execute(self, _task_run, **_kwargs):
            return IngestionResult(groups=1, posts=2, comments=3)

    leases = FakeLeaseStore()
    run = task_run()

    await build_executor(Service(), leases).execute(run)

    assert run.status == "running"
    done = next(call for call in leases.calls if call[0] == "done")
    assert done[1]["processed_items"] == 6
    assert done[1]["stats"] == {
        "groups": 1,
        "posts": 2,
        "comments": 3,
        "authors": 0,
        "errors": 0,
    }


@pytest.mark.anyio
async def test_executor_times_out_and_emits_failed_transition():
    class Service:
        async def execute(self, _task_run, **_kwargs):
            await asyncio.sleep(10)

    leases = FakeLeaseStore()

    await build_executor(Service(), leases, timeout_seconds=0.02).execute(task_run())

    failed = next(call for call in leases.calls if call[0] == "failed")
    assert "timed out" in failed[1]["error"]


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

    await build_executor(Service(), leases).execute(task_run())

    assert cancelled.is_set()
    assert not any(call[0] == "failed" for call in leases.calls)


@pytest.mark.anyio
async def test_executor_stops_after_max_recovery_attempts():
    leases = FakeLeaseStore()

    await build_executor(object(), leases).execute(task_run(attempts=4))

    assert any(call[0] == "failed" for call in leases.calls)
    assert not any(call[0] == "done" for call in leases.calls)


@pytest.mark.anyio
async def test_completion_recording_failure_releases_task_for_retry():
    class Service:
        async def execute(self, _task_run, **_kwargs):
            return IngestionResult(posts=1)

    class FailingLeaseStore(FakeLeaseStore):
        async def done(self, **kwargs):
            raise RuntimeError("database unavailable")

    leases = FailingLeaseStore()

    await build_executor(Service(), leases).execute(task_run())

    assert any(call[0] == "release" for call in leases.calls)
    assert not any(call[0] == "done" for call in leases.calls)
