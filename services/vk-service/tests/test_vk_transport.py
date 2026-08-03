"""Unit tests for VkTransport: errors, redaction and credential rotation."""

import asyncio
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.core.redaction import register_secret
from app.domain.entities.credentials import CredentialMaterial
from app.domain.exceptions.vk_api import (
    VkApiAuthError,
    VkApiInfrastructureError,
    VkApiRateLimitError,
)
from app.infrastructure.vk_client.transport import (
    VkApiConfigurationError,
    VkTransport,
)


class MockVkApiError(Exception):
    def __init__(self, code, error_msg, method="test.method"):
        self.code = code
        self.error = {"error_code": code, "error_msg": error_msg}
        self.method = method


def run_inline(func, *args, **kwargs):
    return func(*args, **kwargs)


async def run_async_inline(func, *args, **kwargs):
    return func(*args, **kwargs)


def _transport(**kwargs) -> VkTransport:
    return VkTransport(call_runner=run_inline, **kwargs)


def _credential(secret: str = "fake-token") -> CredentialMaterial:
    return CredentialMaterial.from_secret(secret)


def _inject_api(
    transport: VkTransport,
    api: MagicMock,
    credential: CredentialMaterial | None = None,
):
    material = credential or _credential()
    transport._apis[material.version_digest] = api


@pytest.mark.anyio
async def test_call_maps_vk_api_error():
    transport = _transport()
    method = MagicMock(side_effect=MockVkApiError(8, "Application is blocked"))
    _inject_api(transport, MagicMock(groups=MagicMock(getById=method)))

    with patch(
        "app.infrastructure.vk_client.transport._VK_API_ERRORS",
        (MockVkApiError,),
    ):
        with pytest.raises(VkApiAuthError) as exc_info:
            await transport.call(_credential(), "groups.getById", group_ids="1")

    assert exc_info.value.code == 8
    assert "Application is blocked" in exc_info.value.error_msg
    assert "groups.getById" in exc_info.value.method


@pytest.mark.anyio
async def test_call_maps_rate_limit():
    transport = _transport()
    method = MagicMock(
        side_effect=MockVkApiError(6, "Too many requests per second")
    )
    _inject_api(transport, MagicMock(wall=MagicMock(get=method)))

    with patch(
        "app.infrastructure.vk_client.transport._VK_API_ERRORS",
        (MockVkApiError,),
    ):
        with pytest.raises(VkApiRateLimitError) as exc_info:
            await transport.call(_credential(), "wall.get", owner_id=-1, count=10)

    assert exc_info.value.code == 6


@pytest.mark.anyio
async def test_call_maps_infrastructure_error():
    transport = _transport()
    _inject_api(
        transport,
        MagicMock(
            groups=MagicMock(getById=MagicMock(side_effect=TimeoutError()))
        ),
    )

    with pytest.raises(VkApiInfrastructureError):
        await transport.call(_credential(), "groups.getById", group_ids="1")


@pytest.mark.anyio
async def test_call_without_token_raises_configuration_error():
    transport = _transport()
    credential = CredentialMaterial.from_secret("")
    with pytest.raises(VkApiConfigurationError):
        await transport.call(credential, "groups.getById", group_ids="1")


@pytest.mark.anyio
async def test_raw_token_never_appears_in_exception():
    secret = "super-secret-token-abc123"
    credential = _credential(secret)
    register_secret(secret)
    transport = _transport()
    method = MagicMock(side_effect=MockVkApiError(8, f"bad {secret}"))
    _inject_api(
        transport,
        MagicMock(groups=MagicMock(getById=method)),
        credential,
    )

    with patch(
        "app.infrastructure.vk_client.transport._VK_API_ERRORS",
        (MockVkApiError,),
    ):
        with pytest.raises(VkApiAuthError) as exc_info:
            await transport.call(credential, "groups.getById", group_ids="1")

    assert secret not in str(exc_info.value)
    assert secret not in exc_info.value.error_msg


@pytest.mark.anyio
async def test_registered_secret_from_file_provider_is_redacted(tmp_path):
    token_file = tmp_path / "token.txt"
    token_file.write_text("mounted-file-token-xyz", encoding="utf-8")

    from app.infrastructure.secrets.file_provider import FileSecretProvider

    material = FileSecretProvider(str(token_file)).load()
    transport = _transport()
    method = MagicMock(
        side_effect=MockVkApiError(
            29,
            "hard limit mounted-file-token-xyz",
        )
    )
    _inject_api(
        transport,
        MagicMock(wall=MagicMock(get=method)),
        material,
    )

    with patch(
        "app.infrastructure.vk_client.transport._VK_API_ERRORS",
        (MockVkApiError,),
    ):
        with pytest.raises(VkApiRateLimitError) as exc_info:
            await transport.call(material, "wall.get", owner_id=-1)

    assert "mounted-file-token-xyz" not in str(exc_info.value)


@pytest.mark.anyio
async def test_call_runs_in_thread_and_returns_result():
    executed_in_thread = []

    async def runner(sync_function, *args, **kwargs):
        executed_in_thread.append(True)
        return await asyncio.to_thread(sync_function, *args, **kwargs)

    transport = VkTransport(call_runner=runner)
    method = MagicMock(return_value={"items": [{"id": 1}]})
    _inject_api(transport, MagicMock(users=MagicMock(get=method)))

    result = await transport.call(_credential(), "users.get", user_ids="1")

    assert result == {"items": [{"id": 1}]}
    assert executed_in_thread == [True]


@pytest.mark.anyio
async def test_transport_builds_distinct_sessions_after_rotation():
    created_tokens = []

    class Session:
        def __init__(self, token):
            self.token = token

        def get_api(self):
            return MagicMock(
                users=MagicMock(
                    get=MagicMock(return_value={"token": self.token})
                )
            )

    def factory(**kwargs):
        created_tokens.append(kwargs["token"])
        return Session(kwargs["token"])

    transport = VkTransport(
        vk_session_factory=factory,
        call_runner=run_async_inline,
    )
    old = _credential("old-token")
    new = _credential("new-token")

    assert await transport.call(old, "users.get") == {"token": "old-token"}
    assert await transport.call(new, "users.get") == {"token": "new-token"}
    assert await transport.call(new, "users.get") == {"token": "new-token"}
    assert created_tokens == ["old-token", "new-token"]
