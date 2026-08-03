import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.services.ingestion.result import IngestionResult
from app.tasks.execution_control import (
    ExecutionAttemptControl,
    ExecutionCancellationRequested,
    FenceLostError,
)
from app.tasks.execution_executor import ExecutionExecutor


class FakeStore:
    def __init__(
        self,
        *,
        complete_result=True,
        fail_result=True,
        cancel_result=True,
    ):
        self.calls = []
        self.complete_result = complete_result
        self.fail_result = fail_result
        self.cancel_result = cancel_result

    async def complete(self, **kwargs):
        self.calls.append(("complete", kwargs))
        return self.complete_result

    async def fail(self, **kwargs):
        self.calls.append(("fail", kwargs))
        return self.fail_result

    async def cancel(self, **kwargs):
        self.calls.append(("cancel", kwargs))
        return self.cancel_result

    async def release(self, **kwargs):
        self.calls.append(("release", kwargs))
        return True


class FakeSession:
    async def __aenter__(self):
        return self

    async def __aexit__(self, *_args):
        return None


class FakeVkClient:
    def bind_snapshot(self, _context):
        return object()


def claim(*, attempt_number=1):
    return SimpleNamespace(
        execution_id=uuid4(),
        attempt_id=uuid4(),
        fencing_token=attempt_number,
        attempt_number=attempt_number,
        task_id=10,
        run_id="run-10",
        processed_items=0,
        total_items=0,
        provider_account_key="system-vk",
        credential_version="version-1",
    )


def build_executor(store):
    return ExecutionExecutor(
        worker_id="worker-1",
        execution_store=store,
        session_factory=FakeSession,
        ingestion_factory=lambda *_args, **_kwargs: object(),
        vk_client=FakeVkClient(),
        provider_accounts_factory=lambda _session: object(),
        lease_seconds=90,
        heartbeat_seconds=20,
        timeout_seconds=60,
        max_attempts=3,
    )


@pytest.mark.anyio
async def test_executor_records_completion_with_attempt_identity(monkeypatch):
    monkeypatch.setattr(ExecutionAttemptControl, "ensure_active", AsyncMock())
    store = FakeStore()
    executor = build_executor(store)
    executor.runner.run = AsyncMock(
        return_value=IngestionResult(groups=1, posts=2, comments=3)
    )
    current = claim(attempt_number=2)

    await executor.execute(current)

    name, payload = store.calls[-1]
    assert name == "complete"
    assert payload["execution_id"] == current.execution_id
    assert payload["attempt_id"] == current.attempt_id
    assert payload["fencing_token"] == 2
    assert payload["processed_items"] == 6


@pytest.mark.anyio
async def test_executor_turns_durable_cancellation_into_terminal_cancel(monkeypatch):
    monkeypatch.setattr(ExecutionAttemptControl, "ensure_active", AsyncMock())
    store = FakeStore()
    executor = build_executor(store)
    executor.runner.run = AsyncMock(
        side_effect=ExecutionCancellationRequested("cancelled")
    )
    current = claim()

    await executor.execute(current)

    assert store.calls == [
        (
            "cancel",
            {
                "execution_id": current.execution_id,
                "attempt_id": current.attempt_id,
                "fencing_token": current.fencing_token,
            },
        )
    ]


@pytest.mark.anyio
async def test_cancellation_wins_race_with_completion(monkeypatch):
    monkeypatch.setattr(ExecutionAttemptControl, "ensure_active", AsyncMock())
    store = FakeStore(complete_result=False, cancel_result=True)
    executor = build_executor(store)
    executor.runner.run = AsyncMock(return_value=IngestionResult(groups=1))
    current = claim()

    await executor.execute(current)

    assert [name for name, _ in store.calls] == ["complete", "cancel"]
    assert store.calls[-1][1]["fencing_token"] == current.fencing_token


@pytest.mark.anyio
async def test_cancellation_wins_race_with_failure():
    store = FakeStore(fail_result=False, cancel_result=True)
    executor = build_executor(store)
    current = claim()

    await executor._fail(current, "late failure")

    assert [name for name, _ in store.calls] == ["fail", "cancel"]


@pytest.mark.anyio
async def test_executor_does_not_finalize_after_fence_loss(monkeypatch):
    monkeypatch.setattr(ExecutionAttemptControl, "ensure_active", AsyncMock())
    store = FakeStore()
    executor = build_executor(store)
    executor.runner.run = AsyncMock(side_effect=FenceLostError("stale"))

    await executor.execute(claim())

    assert store.calls == []


@pytest.mark.anyio
async def test_shutdown_releases_attempt_for_immediate_recovery(monkeypatch):
    monkeypatch.setattr(ExecutionAttemptControl, "ensure_active", AsyncMock())
    store = FakeStore()
    executor = build_executor(store)
    executor.runner.run = AsyncMock(side_effect=asyncio.CancelledError())
    current = claim()

    with pytest.raises(asyncio.CancelledError):
        await executor.execute(current)

    name, payload = store.calls[-1]
    assert name == "release"
    assert payload["execution_id"] == current.execution_id
    assert payload["attempt_id"] == current.attempt_id
    assert payload["error"] == "worker shutdown"


@pytest.mark.anyio
async def test_attempt_budget_is_terminal(monkeypatch):
    monkeypatch.setattr(ExecutionAttemptControl, "ensure_active", AsyncMock())
    store = FakeStore()
    executor = build_executor(store)

    await executor.execute(claim(attempt_number=4))

    assert store.calls[0][0] == "fail"
    assert "attempts exhausted" in store.calls[0][1]["error"].lower()
