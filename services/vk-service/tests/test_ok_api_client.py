import sys
from pathlib import Path

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.infrastructure.ok_client.client import OkApiClient, sign_ok_request


# ---------------------------------------------------------------------------
# Pure function: sign_ok_request
# ---------------------------------------------------------------------------

class TestSignOkRequest:
    def test_sign_rest_method_excludes_access_token(self):
        params = {"application_key": "app_key", "method": "friends.get", "format": "json"}
        sig = sign_ok_request(params, "test_token", "secret", is_users_info=False)
        sig2 = sign_ok_request(params, "test_token", "secret", is_users_info=False)
        assert sig == sig2
        sig3 = sign_ok_request(params, "other_token", "secret", is_users_info=False)
        assert sig != sig3

    def test_sign_strips_access_token(self):
        params = {"application_key": "app_key", "method": "friends.get", "format": "json", "access_token": "should_be_ignored"}
        sig = sign_ok_request(params, "test_token", "secret", is_users_info=False)
        params_clean = {"application_key": "app_key", "method": "friends.get", "format": "json"}
        assert sig == sign_ok_request(params_clean, "test_token", "secret", is_users_info=False)

    def test_sign_rpc_includes_session_key(self):
        params = {"application_key": "app_key", "method": "users.getInfo", "format": "json"}
        sig_rpc = sign_ok_request(params, "test_token", "secret", is_users_info=True)
        sig_rest = sign_ok_request(params, "test_token", "secret", is_users_info=False)
        assert sig_rpc != sig_rest

    def test_sign_is_md5_hex(self):
        params = {"application_key": "app_key", "method": "test.method", "format": "json"}
        sig = sign_ok_request(params, "token", "secret", is_users_info=False)
        assert isinstance(sig, str)
        assert len(sig) == 32


# ---------------------------------------------------------------------------
# Helpers for httpx-based client tests
# ---------------------------------------------------------------------------

def _make_client(json_data, status_code=200):
    """Build OkApiClient that returns *json_data* for every GET request."""
    transport = httpx.MockTransport(lambda _: httpx.Response(status_code, json=json_data))
    http_client = httpx.AsyncClient(transport=transport)
    return OkApiClient(
        access_token="tok",
        application_key="app",
        application_secret_key="sec",
        client=http_client,
    )


async def _assert_raises(client, expected_match, method="friends_get"):
    """Call client.friends_get() or client.users_get_info(...) and expect RuntimeError."""
    with pytest.raises(RuntimeError, match=expected_match):
        if method == "friends_get":
            await client.friends_get()
        else:
            await client.users_get_info(["111"], fields="uid")


# ---------------------------------------------------------------------------
# friends_get response shapes
# ---------------------------------------------------------------------------

class TestFriendsGet:
    @pytest.mark.anyio
    async def test_list_format(self):
        client = _make_client(["111", "222", "333"])
        assert await client.friends_get() == ["111", "222", "333"]

    @pytest.mark.anyio
    async def test_dict_friends_format(self):
        client = _make_client({"friends": ["111", "222"]})
        assert await client.friends_get() == ["111", "222"]

    @pytest.mark.anyio
    async def test_dict_uids_format(self):
        client = _make_client({"uids": ["111", "222", "333"]})
        assert await client.friends_get() == ["111", "222", "333"]

    @pytest.mark.anyio
    async def test_empty_list(self):
        client = _make_client([])
        assert await client.friends_get() == []

    @pytest.mark.anyio
    async def test_dict_unknown_shape(self):
        client = _make_client({"unexpected": "shape"})
        assert await client.friends_get() == []

    @pytest.mark.anyio
    async def test_none_values_filtered(self):
        client = _make_client(["111", None, "333"])
        assert await client.friends_get() == ["111", "333"]

    @pytest.mark.anyio
    async def test_error_code_in_body(self):
        client = _make_client({"error_code": 100, "error_msg": "Invalid parameter"})
        await _assert_raises(client, "Invalid parameter")

    @pytest.mark.anyio
    async def test_error_dict_in_body(self):
        client = _make_client({"error": {"error_code": 200, "error_msg": "Session expired"}})
        await _assert_raises(client, "Session expired")

    @pytest.mark.anyio
    async def test_http_400(self):
        client = _make_client({}, status_code=400)
        await _assert_raises(client, "OK API request failed with HTTP 400")

    @pytest.mark.anyio
    async def test_http_500(self):
        client = _make_client({}, status_code=500)
        await _assert_raises(client, "OK API request failed with HTTP 500")


# ---------------------------------------------------------------------------
# users_get_info response shapes
# ---------------------------------------------------------------------------

class TestUsersGetInfo:
    @pytest.mark.anyio
    async def test_list_format(self):
        client = _make_client([{"uid": "111", "name": "John"}, {"uid": "222", "name": "Jane"}])
        result = await client.users_get_info(["111", "222"], fields="uid,name")
        assert len(result) == 2

    @pytest.mark.anyio
    async def test_dict_users_format(self):
        client = _make_client({"users": [{"uid": "111", "name": "John"}]})
        result = await client.users_get_info(["111"], fields="uid,name")
        assert len(result) == 1

    @pytest.mark.anyio
    async def test_empty_uids(self):
        client = _make_client([])
        result = await client.users_get_info([], fields="uid")
        assert result == []

    @pytest.mark.anyio
    async def test_unknown_shape(self):
        client = _make_client({"unexpected": "shape"})
        result = await client.users_get_info(["111"], fields="uid")
        assert result == []

    @pytest.mark.anyio
    async def test_error_response(self):
        client = _make_client({"error_code": 101, "error_msg": "Unknown method"})
        await _assert_raises(client, "Unknown method", method="users_get_info")


# ---------------------------------------------------------------------------
# Request query parameter verification
# ---------------------------------------------------------------------------

def _make_capturing_client():
    """Build OkApiClient that captures request URL for asserting query params."""
    captured = []

    async def handler(request):
        captured.append(str(request.url))
        return httpx.Response(200, json=[])

    transport = httpx.MockTransport(handler)
    http_client = httpx.AsyncClient(transport=transport)
    client = OkApiClient(
        access_token="tok",
        application_key="app",
        application_secret_key="sec",
        client=http_client,
    )
    return client, captured


class TestRequestParams:
    @pytest.mark.anyio
    async def test_users_get_info_sends_access_token(self):
        client, captured = _make_capturing_client()
        await client.users_get_info(["111"], fields="uid")
        assert len(captured) == 1
        url = captured[0]
        assert "access_token=tok" in url
        assert "session_key=tok" in url

    @pytest.mark.anyio
    async def test_friends_get_sends_access_token(self):
        client, captured = _make_capturing_client()
        await client.friends_get()
        assert len(captured) == 1
        url = captured[0]
        assert "access_token=tok" in url
        assert "session_key=tok" in url

    @pytest.mark.anyio
    async def test_users_get_info_uses_fb_do_path(self):
        client, captured = _make_capturing_client()
        await client.users_get_info(["111"], fields="uid")
        url = captured[0]
        assert "/fb.do" in url

    @pytest.mark.anyio
    async def test_friends_get_uses_api_path(self):
        client, captured = _make_capturing_client()
        await client.friends_get()
        url = captured[0]
        assert "/api/friends/get" in url

    @pytest.mark.anyio
    async def test_request_includes_sig(self):
        client, captured = _make_capturing_client()
        await client.users_get_info(["111"], fields="uid")
        url = captured[0]
        assert "sig=" in url


# ---------------------------------------------------------------------------
# Credentials guard
# ---------------------------------------------------------------------------

class TestCredentials:
    @pytest.mark.anyio
    async def test_missing_credentials_raises(self):
        client = OkApiClient(access_token="tok", application_key="app", application_secret_key="sec")
        client.access_token = ""
        with pytest.raises(RuntimeError, match="OK API credentials are not fully configured"):
            await client.friends_get()
