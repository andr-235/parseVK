import sys
from pathlib import Path

import pytest
from fastapi import HTTPException
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.modules.pop("_service_path", None)

from _service_path import use_service_path

use_service_path()

import app.core.security as _security
from app.main import create_app
from app.modules.comments.service import get_comments_gateway_service
from test_jwt_validation import make_token


class UnavailableCommentsGatewayService:
    async def get_comments(self, **kwargs):
        raise HTTPException(status_code=502, detail="Moderation service error")


def service():
    return UnavailableCommentsGatewayService()


@pytest.fixture(autouse=True)
def inject_jwks_cache(request):
    old_cache = _security._jwks_cache
    token, jwks = make_token()
    _security._jwks_cache = jwks
    request.node._test_token = token
    yield
    _security._jwks_cache = old_cache


@pytest.mark.asyncio
async def test_list_comments_returns_gateway_status_for_moderation_unavailable(request):
    app = create_app()
    app.dependency_overrides[get_comments_gateway_service] = service
    token = request.node._test_token

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        headers={"Authorization": f"Bearer {token}"},
    ) as client:
        response = await client.get("/api/v1/comments")

    assert response.status_code == 502
    assert response.json()["detail"] == "Moderation service error"
