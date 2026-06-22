import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.domain.exceptions.vk_api import (
    VkApiAuthError,
    VkApiCaptchaError,
    VkApiDomainError,
    VkApiInfrastructureError,
    VkApiRateLimitError,
    map_vk_error,
)


class TestMapVkError:
    def test_auth_errors(self):
        for code in [5, 7, 8, 15, 27, 28, 100]:
            exc = map_vk_error(code, "msg", "test.method")
            assert isinstance(exc, VkApiAuthError)
            assert exc.code == code
            assert exc.error_msg == "msg"
            assert exc.method == "test.method"

    def test_rate_limit_errors(self):
        for code in [6, 9, 29]:
            exc = map_vk_error(code, "rate limit", "wall.get")
            assert isinstance(exc, VkApiRateLimitError)
            assert exc.code == code
            assert exc.error_msg == "rate limit"

    def test_captcha_error(self):
        exc = map_vk_error(14, "captcha needed")
        assert isinstance(exc, VkApiCaptchaError)
        assert exc.code == 14

    def test_infrastructure_error(self):
        exc = map_vk_error(10, "internal server error")
        assert isinstance(exc, VkApiInfrastructureError)
        assert exc.code == 10

    def test_unknown_code_defaults_to_domain_error(self):
        exc = map_vk_error(999, "unknown")
        assert isinstance(exc, VkApiDomainError)
        assert not isinstance(exc, VkApiAuthError)
        assert exc.code == 999


class TestVkApiDomainError:
    def test_inherits_from_runtime_error(self):
        exc = VkApiAuthError(8, "blocked")
        assert isinstance(exc, RuntimeError)

    def test_format_includes_code_and_message(self):
        exc = VkApiDomainError(8, "Application is blocked")
        assert str(exc) == "[8] Application is blocked"

    def test_error_msg_preserved(self):
        exc = VkApiAuthError(8, "Application is blocked")
        assert exc.error_msg == "Application is blocked"

    def test_method_preserved(self):
        exc = VkApiAuthError(8, "blocked", method="wall.get")
        assert exc.method == "wall.get"


def run_inline(func, *args, **kwargs):
    return func(*args, **kwargs)


class MockVkApiError(Exception):
    def __init__(self, code, error_msg, method="test.method"):
        self.code = code
        self.error = {"error_code": code, "error_msg": error_msg}
        self.method = method


@pytest.mark.anyio
async def test_vk_api_client_call_sync_preserves_error_code():
    from unittest.mock import MagicMock, patch

    from app.infrastructure.vk_client.client import VkApiClient

    client = VkApiClient(token="fake-token", call_runner=run_inline)

    mock_method = MagicMock(side_effect=MockVkApiError(8, "Application is blocked"))
    mock_namespace = MagicMock(**{"getById": mock_method})

    client._api = MagicMock()
    client._api.groups = mock_namespace

    with patch("app.infrastructure.vk_client.base._VK_API_ERRORS", (MockVkApiError,)):
        with pytest.raises(VkApiAuthError) as exc_info:
            await client._call("groups.getById", group_ids="1")

    assert exc_info.value.code == 8
    assert "Application is blocked" in exc_info.value.error_msg
    assert "groups.getById" in exc_info.value.method


@pytest.mark.anyio
async def test_vk_api_client_call_sync_maps_rate_limit():
    from unittest.mock import MagicMock, patch

    from app.infrastructure.vk_client.client import VkApiClient

    client = VkApiClient(token="fake-token", call_runner=run_inline)

    mock_method = MagicMock(side_effect=MockVkApiError(6, "Too many requests per second"))
    mock_namespace = MagicMock(**{"get": mock_method})

    client._api = MagicMock()
    client._api.wall = mock_namespace

    with patch("app.infrastructure.vk_client.base._VK_API_ERRORS", (MockVkApiError,)):
        with pytest.raises(VkApiRateLimitError) as exc_info:
            await client._call("wall.get", owner_id=-1, count=10)

    assert exc_info.value.code == 6


@pytest.mark.anyio
async def test_vk_api_client_call_sync_fallback_to_runtime_error():
    from unittest.mock import MagicMock

    from app.infrastructure.vk_client.client import VkApiClient

    client = VkApiClient(token="fake-token", call_runner=run_inline)

    mock_method = MagicMock(side_effect=ValueError("something else"))
    mock_namespace = MagicMock(**{"getById": mock_method})

    client._api = MagicMock()
    client._api.groups = mock_namespace

    with pytest.raises(RuntimeError):
        await client._call("groups.getById", group_ids="1")
