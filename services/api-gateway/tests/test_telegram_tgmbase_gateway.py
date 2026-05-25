import sys
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.modules.pop("_service_path", None)

from _service_path import use_service_path  # noqa: E402

use_service_path()

import app.core.security as _security  # noqa: E402
from app.main import create_app  # noqa: E402
from test_jwt_validation import make_token  # noqa: E402


@pytest.fixture(autouse=True)
def inject_jwks_cache(request):
    old_cache = _security._jwks_cache
    token, jwks = make_token()
    _security._jwks_cache = jwks
    request.node._test_token = token
    yield
    _security._jwks_cache = old_cache


def _token(request) -> str:
    return request.node._test_token


@pytest.mark.asyncio
async def test_telegram_tgmbase_capabilities_require_auth():
    app = create_app()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/telegram-tgmbase/capabilities")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_telegram_tgmbase_capabilities_describe_gateway_boundary(request):
    app = create_app()

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        headers={"Authorization": f"Bearer {_token(request)}"},
    ) as client:
        response = await client.get("/api/v1/telegram-tgmbase/capabilities")

    assert response.status_code == 200
    data = response.json()
    assert data == {
        "domain": "telegram-tgmbase",
        "migrationStage": "inventory",
        "gatewayManaged": ["capabilities"],
        "fallbackManaged": [
            "telegram-auth-session",
            "telegram-sync",
            "telegram-export",
            "telegram-dl-import",
            "telegram-dl-match",
            "tgmbase-search",
            "tgmbase-search-progress",
        ],
        "redaction": {
            "enabled": True,
            "sensitiveFields": [
                "apiHash",
                "apiId",
                "authKey",
                "cookie",
                "password",
                "phone",
                "phoneCode",
                "session",
                "sessionString",
                "token",
            ],
        },
    }


@pytest.mark.asyncio
async def test_telegram_tgmbase_capabilities_do_not_expose_secret_values(request):
    app = create_app()

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        headers={"Authorization": f"Bearer {_token(request)}"},
    ) as client:
        response = await client.get("/api/v1/telegram-tgmbase/capabilities")

    body = response.text
    assert "sessionString=" not in body
    assert "api_hash_" not in body
    assert "phoneCode=" not in body
    assert "cookie=" not in body
