"""Tests for startup reconciliation and single credential validation."""

import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.domain.entities.credentials import CredentialMaterial
from app.domain.entities.provider_account import (
    ACCOUNT_STATUS_ACTIVE,
    ACCOUNT_STATUS_COOLING_DOWN,
    ACCOUNT_STATUS_INVALID,
    SYSTEM_VK_ACCOUNT_KEY,
    ProviderAccount,
)
from app.domain.exceptions.vk_api import VkApiAuthError, VkApiInfrastructureError
from app.domain.ports.secret_provider import SecretProviderError
from app.tasks.provider_reconciliation import (
    STARTUP_VALIDATION_LANE,
    reconcile_provider_account,
)


@pytest.fixture
def anyio_backend():
    return "asyncio"


def _account(
    *,
    status=ACCOUNT_STATUS_ACTIVE,
    credential_version="v-old",
    cooldown_until=None,
) -> ProviderAccount:
    now = datetime.now(UTC)
    return ProviderAccount(
        id=uuid4(),
        account_key=SYSTEM_VK_ACCOUNT_KEY,
        provider="vk",
        status=status,
        credential_version=credential_version,
        capabilities=[],
        cooldown_until=cooldown_until,
        last_error_code=None,
        last_error_kind=None,
        last_validated_at=None,
        revision=1,
        created_at=now,
        updated_at=now,
    )


class FakeSecretProvider:
    def __init__(self, token: str | None = "secret-token"):
        self._token = token

    def load(self) -> CredentialMaterial:
        if self._token is None:
            raise SecretProviderError("VK secret file is missing")
        return CredentialMaterial.from_secret(self._token)


class FakeProviderAccounts:
    def __init__(self, account: ProviderAccount | None = None):
        self.account = account
        self.upserts = []
        self.transitions = []
        self.mark_active_calls = []
        self.touch_calls = 0

    async def get_by_key(self, account_key):
        return self.account

    async def upsert_system(self, *, account_key, provider, credential_version, capabilities=None):
        now = datetime.now(UTC)
        entity = ProviderAccount(
            id=uuid4(),
            account_key=account_key,
            provider=provider,
            status=ACCOUNT_STATUS_ACTIVE,
            credential_version=credential_version,
            capabilities=list(capabilities or []),
            cooldown_until=None,
            last_error_code=None,
            last_error_kind=None,
            last_validated_at=None,
            revision=0,
            created_at=now,
            updated_at=now,
        )
        self.account = entity
        self.upserts.append(entity)
        return entity

    async def transition_to_invalid(self, account_id, credential_version, *, error_code=None, error_kind=None):
        self.transitions.append((account_id, credential_version, error_code, error_kind))
        if self.account is None or self.account.status == ACCOUNT_STATUS_INVALID:
            return False
        self.account = self.account.__class__(
            **{**self.account.__dict__, "status": ACCOUNT_STATUS_INVALID,
               "last_error_code": error_code, "last_error_kind": error_kind}
        )
        return True

    async def set_cooldown(self, account_id, until):
        self.account = self.account.__class__(
            **{**self.account.__dict__, "status": ACCOUNT_STATUS_COOLING_DOWN, "cooldown_until": until}
        )

    async def mark_active(self, account_id, credential_version, capabilities):
        self.mark_active_calls.append((account_id, credential_version, capabilities))
        self.account = self.account.__class__(
            **{**self.account.__dict__, "status": ACCOUNT_STATUS_ACTIVE,
               "credential_version": credential_version, "capabilities": capabilities}
        )
        return self.account

    async def touch_validated(self, account_id):
        self.touch_calls += 1


class FakeBoundClient:
    def __init__(self, error=None):
        self._error = error
        self.test_token_calls = 0

    async def test_token(self):
        self.test_token_calls += 1
        if self._error is not None:
            raise self._error
        return {}


class FakeVkClient:
    def __init__(self, error=None):
        self._error = error
        self.bound_contexts = []

    @property
    def credential_version(self):
        return "unused"

    def bind(self, context):
        self.bound_contexts.append(context)
        return FakeBoundClient(self._error)


@pytest.mark.anyio
async def test_new_version_validated_once_and_activated():
    provider = FakeSecretProvider("secret-a")
    accounts = FakeProviderAccounts()
    vk = FakeVkClient()

    result = await reconcile_provider_account(vk, provider, accounts)

    assert result.status == ACCOUNT_STATUS_ACTIVE
    assert result.reason == "validated"
    assert len(accounts.upserts) == 1
    assert len(vk.bound_contexts) == 1
    assert vk.bound_contexts[0].lane_id == STARTUP_VALIDATION_LANE
    assert vk.bound_contexts[0].credential_version == result.credential_version
    assert accounts.mark_active_calls == [
        (accounts.upserts[0].id, result.credential_version, ["vk.all"])
    ]
    assert accounts.touch_calls == 1


@pytest.mark.anyio
async def test_new_version_auth_error_marks_invalid():
    provider = FakeSecretProvider("secret-b")
    accounts = FakeProviderAccounts()
    vk = FakeVkClient(error=VkApiAuthError(8, "invalid token", "users.get"))

    result = await reconcile_provider_account(vk, provider, accounts)

    assert result.status == ACCOUNT_STATUS_INVALID
    assert result.reason == "auth error"
    assert accounts.transitions == [
        (accounts.upserts[0].id, result.credential_version, 8, "auth")
    ]
    assert accounts.mark_active_calls == []


@pytest.mark.anyio
async def test_same_version_invalid_stays_invalid_without_validation():
    digest = CredentialMaterial.from_secret("secret-c").version_digest
    accounts = FakeProviderAccounts(_account(status=ACCOUNT_STATUS_INVALID, credential_version=digest))
    vk = FakeVkClient()

    result = await reconcile_provider_account(vk, FakeSecretProvider("secret-c"), accounts)

    assert result.status == ACCOUNT_STATUS_INVALID
    assert result.reason == "already invalid"
    assert vk.bound_contexts == []
    assert accounts.upserts == []


@pytest.mark.anyio
async def test_same_version_active_stays_active_without_validation():
    digest = CredentialMaterial.from_secret("secret-d").version_digest
    accounts = FakeProviderAccounts(_account(status=ACCOUNT_STATUS_ACTIVE, credential_version=digest))
    vk = FakeVkClient()

    result = await reconcile_provider_account(vk, FakeSecretProvider("secret-d"), accounts)

    assert result.status == ACCOUNT_STATUS_ACTIVE
    assert result.reason == "unchanged"
    assert vk.bound_contexts == []
    assert accounts.upserts == []


@pytest.mark.anyio
async def test_cooldown_active_stays_cooling_down():
    future = datetime.now(UTC) + timedelta(hours=1)
    accounts = FakeProviderAccounts(
        _account(status=ACCOUNT_STATUS_COOLING_DOWN, cooldown_until=future)
    )
    vk = FakeVkClient()

    result = await reconcile_provider_account(vk, FakeSecretProvider("secret-e"), accounts)

    assert result.status == ACCOUNT_STATUS_COOLING_DOWN
    assert result.reason == "cooldown active"
    assert vk.bound_contexts == []


@pytest.mark.anyio
async def test_missing_secret_reports_invalid_without_db_writes():
    accounts = FakeProviderAccounts()
    vk = FakeVkClient()

    result = await reconcile_provider_account(vk, FakeSecretProvider(None), accounts)

    assert result.status == ACCOUNT_STATUS_INVALID
    assert result.reason == "secret missing"
    assert vk.bound_contexts == []
    assert accounts.upserts == []


@pytest.mark.anyio
async def test_empty_secret_reports_invalid():
    accounts = FakeProviderAccounts()
    vk = FakeVkClient()

    result = await reconcile_provider_account(vk, FakeSecretProvider(""), accounts)

    assert result.status == ACCOUNT_STATUS_INVALID
    assert result.reason == "secret missing"


@pytest.mark.anyio
async def test_infra_error_does_not_invalidate():
    provider = FakeSecretProvider("secret-f")
    accounts = FakeProviderAccounts()
    vk = FakeVkClient(error=VkApiInfrastructureError(10, "network down", "users.get"))

    result = await reconcile_provider_account(vk, provider, accounts)

    assert result.status == ACCOUNT_STATUS_ACTIVE
    assert result.reason == "validation not completed"
    assert accounts.transitions == []


@pytest.mark.anyio
async def test_version_changed_while_invalid_revalidates():
    old_digest = CredentialMaterial.from_secret("secret-old").version_digest
    accounts = FakeProviderAccounts(_account(status=ACCOUNT_STATUS_INVALID, credential_version=old_digest))
    vk = FakeVkClient()

    result = await reconcile_provider_account(vk, FakeSecretProvider("secret-new"), accounts)

    assert result.status == ACCOUNT_STATUS_ACTIVE
    assert result.reason == "validated"
    assert len(vk.bound_contexts) == 1
    assert accounts.mark_active_calls != []
