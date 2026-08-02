"""Tests for bound-client context, propagation and credential snapshots."""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.domain.entities.credentials import CredentialMaterial
from app.domain.exceptions.vk_api import VkApiAuthError
from app.infrastructure.vk_client.client import (
    BoundVkApiClient,
    CredentialVersionMismatchError,
    ProviderContextMissingError,
    ProviderRequestContext,
    VkApiClient,
    current_request_context,
)


@pytest.fixture
def anyio_backend():
    return "asyncio"


class RecordingScheduler:
    def __init__(self):
        self.calls = []

    async def execute(self, account_id, lane_id, call):
        self.calls.append((account_id, lane_id))
        return await call()


class RecordingTransport:
    def __init__(self, response=None, error=None):
        self.calls = []
        self.response = response
        self.error = error

    async def call(self, credential, method, **params):
        self.calls.append((credential, method, params))
        if self.error is not None:
            raise self.error
        return self.response


def _context(secret: str, lane_id: str = "run-1") -> ProviderRequestContext:
    material = CredentialMaterial.from_secret(secret)
    return ProviderRequestContext(
        account_id="system-vk",
        credential_version=material.version_digest,
        lane_id=lane_id,
    )


@pytest.mark.anyio
async def test_unbound_client_fails_fast():
    client = VkApiClient(token="t")

    with pytest.raises(ProviderContextMissingError, match="bind"):
        await client.get_groups([1])


@pytest.mark.anyio
async def test_bound_client_passes_context_to_scheduler():
    scheduler = RecordingScheduler()
    transport = RecordingTransport(response={"groups": [{"id": 1}]})
    client = VkApiClient(
        token="secret-token",
        scheduler=scheduler,
        transport=transport,
    )
    context = _context("secret-token")

    bound = client.bind(context)
    assert isinstance(bound, BoundVkApiClient)
    assert bound.context is context

    result = await bound.get_groups([1])

    assert result == [{"id": 1}]
    assert scheduler.calls == [("system-vk", "run-1")]
    assert transport.calls[0][0].raw_secret == "secret-token"
    assert transport.calls[0][1] == "groups.getById"
    assert transport.calls[0][2] == {"group_ids": "1"}


@pytest.mark.anyio
async def test_bound_client_sets_contextvar_for_tracing():
    observed = []

    class CtxTransport:
        async def call(self, credential, method, **params):
            observed.append(current_request_context())
            return {}

    client = VkApiClient(
        token="t",
        scheduler=RecordingScheduler(),
        transport=CtxTransport(),
    )
    context = _context("t")

    await client.bind(context).test_token()

    assert observed == [context]
    assert current_request_context() is None


@pytest.mark.anyio
async def test_bound_client_propagates_auth_error_without_retry():
    scheduler = RecordingScheduler()
    transport = RecordingTransport(
        error=VkApiAuthError(5, "auth failed", "users.get")
    )
    client = VkApiClient(token="t", scheduler=scheduler, transport=transport)
    bound = client.bind(_context("t"))

    with pytest.raises(VkApiAuthError) as exc_info:
        await bound.test_token()

    assert exc_info.value.code == 5
    assert scheduler.calls == [("system-vk", "run-1")]


def test_bind_rejects_context_for_different_credential():
    client = VkApiClient(token="current-token")

    with pytest.raises(CredentialVersionMismatchError, match="mismatch"):
        client.bind(_context("old-token"))


def test_bind_credential_uses_exact_supplied_material():
    material = CredentialMaterial.from_secret("candidate-token")
    client = VkApiClient(token="different-live-token")
    context = ProviderRequestContext(
        account_id="system-vk",
        credential_version=material.version_digest,
        lane_id="validation",
    )

    bound = client.bind_credential(material, context)

    assert bound.credential_version == material.version_digest
    assert bound.display_version == material.display_version


def test_display_version_and_credential_version_from_token():
    material = CredentialMaterial.from_secret("secret-token")
    client = VkApiClient(token="secret-token")

    assert client.credential_version == material.version_digest
    assert client.display_version == material.display_version
    assert "secret-token" not in client.display_version


def test_empty_token_bind_raises_configuration_error():
    from app.infrastructure.vk_client.transport import VkApiConfigurationError

    client = VkApiClient(token="")
    context = ProviderRequestContext(
        account_id="system-vk",
        credential_version="",
        lane_id="test",
    )

    with pytest.raises(VkApiConfigurationError, match="VK token is not configured"):
        client.bind(context)
