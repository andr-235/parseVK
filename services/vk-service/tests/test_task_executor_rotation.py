from datetime import UTC, datetime
from uuid import uuid4

import pytest
from task_executor_fakes import FakeLeaseStore, build_executor, task_run

from app.domain.entities.provider_account import ProviderAccount
from app.infrastructure.vk_client.client import CredentialVersionMismatchError


class ChangedCredentialClient:
    def bind_snapshot(self, _context):
        raise CredentialVersionMismatchError("credential mismatch")


class RecordingAccounts:
    def __init__(self):
        now = datetime.now(UTC)
        self.account = ProviderAccount(
            id=uuid4(),
            account_key="system-vk",
            provider="vk",
            status="active",
            credential_version="fake-version",
            capabilities=["vk.all"],
            cooldown_until=None,
            last_error_code=None,
            last_error_kind=None,
            last_validated_at=now,
            revision=1,
            created_at=now,
            updated_at=now,
        )
        self.transitions = []

    async def get_by_key(self, _account_key):
        return self.account

    async def transition_to_invalid(
        self,
        account_id,
        credential_version,
        *,
        error_code=None,
        error_kind=None,
    ):
        self.transitions.append(
            (account_id, credential_version, error_code, error_kind)
        )
        return credential_version == self.account.credential_version


class FakeGate:
    invalidated = False

    async def can_claim(self):
        return True

    def invalidate(self):
        self.invalidated = True


@pytest.mark.anyio
async def test_runtime_rotation_blocks_account_and_releases_attempt():
    class Service:
        async def execute(self, *_args, **_kwargs):
            raise AssertionError("ingestion must not start with a stale credential")

    leases = FakeLeaseStore()
    accounts = RecordingAccounts()
    gate = FakeGate()
    executor = build_executor(
        Service(),
        leases,
        vk_client=ChangedCredentialClient(),
        provider_accounts_factory=lambda _session: accounts,
        account_gate=gate,
    )

    await executor.execute(task_run())

    assert accounts.transitions == [
        (accounts.account.id, "fake-version", None, "credential_changed")
    ]
    assert gate.invalidated is True
    release = next(call for call in leases.calls if call[0] == "release")
    assert release[1]["error"] == "provider_credential_changed"
    assert not any(call[0] == "failed" for call in leases.calls)
