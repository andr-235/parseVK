"""Function-level tests for the validate-token CLI."""

from datetime import UTC, datetime
from uuid import uuid4

import pytest

from app.core.redaction import register_secret
from app.domain.entities.credentials import CredentialMaterial
from app.domain.entities.provider_account import (
    ACCOUNT_STATUS_ACTIVE,
    ACCOUNT_STATUS_INVALID,
    SYSTEM_VK_ACCOUNT_KEY,
    SYSTEM_VK_CAPABILITY,
)
from app.domain.exceptions.vk_api import VkApiAuthError, VkApiInfrastructureError
from scripts.validate_token import (
    CAPABILITIES,
    EXIT_AUTH_FAILURE,
    EXIT_INFRA_CONFIG,
    EXIT_OK,
    exit_code_for,
    read_account_status,
    validate_candidate,
)

CREDENTIAL = CredentialMaterial.from_secret("candidate-secret-123")


class FakeTransport:
    def __init__(self, *, error: Exception | None = None):
        self.error = error
        self.calls = []

    async def call(self, credential, method, **params):
        self.calls.append((method, params))
        if self.error is not None:
            raise self.error
        return {}


class FakeScheduler:
    def __init__(self):
        self.executions = []

    async def execute(self, account_id, lane_id, call):
        self.executions.append((account_id, lane_id))
        return await call()


class FakeAccounts:
    def __init__(self, account=None):
        self.account = account

    async def get_by_key(self, account_key):
        return self.account


@pytest.mark.anyio
async def test_validate_candidate_ok_shape():
    transport = FakeTransport()
    payload = await validate_candidate(
        CREDENTIAL,
        transport=transport,
        scheduler=FakeScheduler(),
    )

    assert payload["account_key"] == SYSTEM_VK_ACCOUNT_KEY
    assert payload["display_version"] == CREDENTIAL.display_version
    assert payload["status"] == ACCOUNT_STATUS_ACTIVE
    assert payload["capabilities"] == CAPABILITIES
    assert payload["validated_at"] is not None
    assert payload["ok"] is True
    assert payload["errors"] == []
    assert set(payload) == {
        "account_key",
        "display_version",
        "status",
        "capabilities",
        "validated_at",
        "ok",
        "errors",
    }
    assert transport.calls == [("users.get", {"user_ids": "1"})]
    assert exit_code_for(payload) == EXIT_OK


@pytest.mark.anyio
async def test_validate_candidate_auth_failure_maps_to_exit_1():
    transport = FakeTransport(
        error=VkApiAuthError(5, "token expired", "users.get")
    )
    payload = await validate_candidate(
        CREDENTIAL,
        transport=transport,
        scheduler=FakeScheduler(),
    )

    assert payload["status"] == ACCOUNT_STATUS_INVALID
    assert payload["ok"] is False
    assert payload["errors"] == ["[5] token expired"]
    assert exit_code_for(payload) == EXIT_AUTH_FAILURE


@pytest.mark.anyio
async def test_validate_candidate_infra_error_maps_to_exit_2():
    transport = FakeTransport(
        error=VkApiInfrastructureError(10, "server error", "users.get")
    )
    payload = await validate_candidate(
        CREDENTIAL,
        transport=transport,
        scheduler=FakeScheduler(),
    )

    assert payload["status"] == "unknown"
    assert payload["ok"] is False
    assert payload["errors"] == ["[10] server error"]
    assert exit_code_for(payload) == EXIT_INFRA_CONFIG


@pytest.mark.anyio
async def test_validate_candidate_works_while_account_invalid():
    transport = FakeTransport()
    payload = await validate_candidate(
        CREDENTIAL,
        transport=transport,
        scheduler=FakeScheduler(),
    )

    assert payload["ok"] is True
    assert transport.calls


@pytest.mark.anyio
async def test_secret_never_in_output():
    register_secret(CREDENTIAL.raw_secret)
    transport = FakeTransport(
        error=VkApiAuthError(
            5,
            f"expired: {CREDENTIAL.raw_secret}",
            "users.get",
        )
    )
    payload = await validate_candidate(
        CREDENTIAL,
        transport=transport,
        scheduler=FakeScheduler(),
    )

    assert CREDENTIAL.raw_secret not in payload["errors"][0]
    assert CREDENTIAL.raw_secret not in str(payload)
    assert "<redacted>" in payload["errors"][0]


@pytest.mark.anyio
async def test_account_status_unconfigured():
    payload = await read_account_status(
        None,
        accounts_factory=lambda _session: FakeAccounts(None),
    )

    assert payload["status"] == "unconfigured"
    assert payload["ok"] is False
    assert payload["display_version"] is None
    assert exit_code_for(payload) == EXIT_INFRA_CONFIG


@pytest.mark.anyio
async def test_account_status_invalid_account():
    account = FakeProviderAccount(status=ACCOUNT_STATUS_INVALID)
    payload = await read_account_status(
        None,
        accounts_factory=lambda _session: FakeAccounts(account),
    )

    assert payload["status"] == ACCOUNT_STATUS_INVALID
    assert payload["display_version"] == account.credential_version[:12]
    assert payload["ok"] is False
    assert payload["errors"]
    assert exit_code_for(payload) == EXIT_AUTH_FAILURE


@pytest.mark.anyio
async def test_account_status_active_account():
    account = FakeProviderAccount(status=ACCOUNT_STATUS_ACTIVE)
    payload = await read_account_status(
        None,
        accounts_factory=lambda _session: FakeAccounts(account),
    )

    assert payload["status"] == ACCOUNT_STATUS_ACTIVE
    assert payload["ok"] is True
    assert payload["validated_at"] is not None
    assert exit_code_for(payload) == EXIT_OK


@pytest.mark.anyio
async def test_account_status_missing_vk_all_capability():
    account = FakeProviderAccount(
        status=ACCOUNT_STATUS_ACTIVE,
        capabilities=["groups", "posts"],
    )
    payload = await read_account_status(
        None,
        accounts_factory=lambda _session: FakeAccounts(account),
    )

    assert payload["ok"] is False
    assert "vk.all" in payload["errors"][0]
    assert exit_code_for(payload) == EXIT_INFRA_CONFIG


class FakeProviderAccount:
    def __init__(self, *, status: str, capabilities=None):
        self.account_key = SYSTEM_VK_ACCOUNT_KEY
        self.status = status
        self.credential_version = CREDENTIAL.version_digest
        self.capabilities = (
            [SYSTEM_VK_CAPABILITY] if capabilities is None else capabilities
        )
        self.last_validated_at = datetime.now(UTC)
        self.id = uuid4()

    @property
    def can_execute_vk(self):
        return (
            self.status == ACCOUNT_STATUS_ACTIVE
            and SYSTEM_VK_CAPABILITY in self.capabilities
        )
