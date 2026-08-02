from datetime import UTC, datetime
from uuid import uuid4

import pytest
from fastapi import HTTPException
from starlette.requests import Request

from app.api.dependencies import get_vk_client_dep
from app.domain.entities.credentials import CredentialMaterial
from app.domain.entities.provider_account import ProviderAccount
from app.infrastructure.vk_client.client import BoundVkApiClient, VkApiClient


def _request() -> Request:
    return Request(
        {
            "type": "http",
            "method": "GET",
            "path": "/internal/vk/test-token",
            "headers": [],
        }
    )


def _account(secret: str, *, status: str = "active") -> ProviderAccount:
    now = datetime.now(UTC)
    return ProviderAccount(
        id=uuid4(),
        account_key="system-vk",
        provider="vk",
        status=status,
        credential_version=CredentialMaterial.from_secret(secret).version_digest,
        capabilities=["vk.all"],
        cooldown_until=None,
        last_error_code=None,
        last_error_kind=None,
        last_validated_at=now,
        revision=1,
        created_at=now,
        updated_at=now,
    )


class Accounts:
    def __init__(self, account):
        self.account = account

    async def get_by_key(self, account_key):
        assert account_key == "system-vk"
        return self.account


@pytest.mark.anyio
async def test_http_dependency_returns_bound_client(monkeypatch):
    from app.api import dependencies

    secret = "active-token"
    client = VkApiClient(token=secret)
    account = _account(secret)
    monkeypatch.setattr(dependencies.bootstrap, "get_vk_client", lambda: client)
    monkeypatch.setattr(
        dependencies.bootstrap,
        "get_provider_account_repository",
        lambda _session: Accounts(account),
    )

    bound = await get_vk_client_dep(_request(), object())

    assert isinstance(bound, BoundVkApiClient)
    assert bound.context.account_id == "system-vk"
    assert bound.context.credential_version == account.credential_version
    assert bound.context.lane_id.startswith("http:")


@pytest.mark.anyio
async def test_http_dependency_rejects_inactive_account(monkeypatch):
    from app.api import dependencies

    secret = "inactive-token"
    monkeypatch.setattr(
        dependencies.bootstrap,
        "get_vk_client",
        lambda: VkApiClient(token=secret),
    )
    monkeypatch.setattr(
        dependencies.bootstrap,
        "get_provider_account_repository",
        lambda _session: Accounts(_account(secret, status="invalid")),
    )

    with pytest.raises(HTTPException) as exc_info:
        await get_vk_client_dep(_request(), object())

    assert exc_info.value.status_code == 503
    assert "not active" in str(exc_info.value.detail)
