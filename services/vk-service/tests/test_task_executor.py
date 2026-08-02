import asyncio
from datetime import UTC, datetime
from uuid import uuid4

import pytest
from task_executor_fakes import FakeLeaseStore, build_executor, task_run

from app.domain.entities.provider_account import (
    SYSTEM_VK_ACCOUNT_KEY,
    ProviderAccount,
)
from app.domain.exceptions.vk_api import VkApiAuthError
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


def _account() -> ProviderAccount:
    now = datetime.now(UTC)
    return ProviderAccount(
        id=uuid4(),
        account_key=SYSTEM_VK_ACCOUNT_KEY,
        provider="vk",
        status="active",
        credential_version="v1",
        capabilities=[],
        cooldown_until=None,
        last_error_code=None,
        last_error_kind=None,
        last_validated_at=None,
        revision=1,
        created_at=now,
        updated_at=now,
    )


class RecordingAccounts:
    def __init__(self, account):
        self.account = account
        self.transitions = []

    async def get_by_key(self, account_key):
        return self.account

    async def transition_to_invalid(self, account_id, credential_version, *, error_code=None, error_kind=None):
        self.transitions.append((account_id, credential_version, error_code, error_kind))
        return True


class FakeGate:
    def __init__(self, allowed=True):
        self.allowed = allowed
        self.invalidated = False

    async def can_claim(self):
        return self.allowed

    def invalidate(self):
        self.invalidated = True


@pytest.mark.anyio
async def test_executor_auth_error_releases_blocked_and_marks_account_invalid():
    account = _account()

    class Service:
        async def execute(self, _task_run, **_kwargs):
            raise VkApiAuthError(8, "invalid token", "users.get")

    leases = FakeLeaseStore()
    accounts = RecordingAccounts(account)
    gate = FakeGate()
    executor = build_executor(
        Service(),
        leases,
        provider_accounts_factory=lambda _session: accounts,
        account_gate=gate,
    )

    await executor.execute(task_run())

    assert accounts.transitions == [(account.id, "v1", 8, "auth")]
    assert gate.invalidated is True
    release = next(call for call in leases.calls if call[0] == "release")
    assert release[1]["error"] == "provider_account_invalid"
    assert not any(call[0] == "failed" for call in leases.calls)
    assert not any(call[0] == "done" for call in leases.calls)


@pytest.mark.anyio
async def test_executor_blocked_when_account_inactive_without_vk_calls():
    called = asyncio.Event()

    class Service:
        async def execute(self, _task_run, **_kwargs):
            called.set()

    leases = FakeLeaseStore()
    gate = FakeGate(allowed=False)
    executor = build_executor(
        Service(),
        leases,
        account_gate=gate,
    )

    await executor.execute(task_run())

    assert not called.is_set()
    release = next(call for call in leases.calls if call[0] == "release")
    assert release[1]["error"] == "provider_account_blocked"
    assert not any(call[0] == "failed" for call in leases.calls)


@pytest.mark.anyio
async def test_executor_auth_error_does_not_emit_terminal_failure():
    class Service:
        async def execute(self, _task_run, **_kwargs):
            raise VkApiAuthError(5, "access denied", "groups.getById")

    leases = FakeLeaseStore()

    await build_executor(Service(), leases).execute(task_run())

    assert not any(call[0] == "failed" for call in leases.calls)
    assert any(call[0] == "release" for call in leases.calls)
