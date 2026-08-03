"""Tests for the TaskFinalizer release paths."""

import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from task_executor_fakes import task_run

from app.tasks.task_finalizer import TaskFinalizer


@pytest.fixture
def anyio_backend():
    return "asyncio"


class FakeLeaseStore:
    def __init__(self):
        self.releases = []

    async def release(self, **kwargs):
        self.releases.append(kwargs)
        return True


@pytest.mark.anyio
async def test_release_blocked_releases_immediately_without_backoff():
    store = FakeLeaseStore()
    finalizer = TaskFinalizer(worker_id="worker-1", lease_store=store)
    run = task_run(attempts=3)

    await finalizer.release_blocked(run, "provider_account_invalid")

    assert len(store.releases) == 1
    call = store.releases[0]
    assert call["task_id"] == run.task_id
    assert call["run_id"] == run.run_id
    assert call["worker_id"] == "worker-1"
    assert call["error"] == "provider_account_invalid"
    now = datetime.now(UTC)
    assert call["available_at"] <= now + timedelta(seconds=1)
    assert call["available_at"] >= now - timedelta(seconds=1)


@pytest.mark.anyio
async def test_release_applies_exponential_backoff():
    store = FakeLeaseStore()
    finalizer = TaskFinalizer(worker_id="worker-1", lease_store=store)
    run = task_run(attempts=3)

    await finalizer.release(run, "retry me")

    call = store.releases[0]
    assert call["error"] == "retry me"
    assert call["available_at"] >= datetime.now(UTC) + timedelta(seconds=4)
