# ruff: noqa: E402
import sys
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.modules.pop("_service_path", None)

from _service_path import use_service_path

use_service_path()

import app.core.security as _security
from app.main import create_app
from app.modules.comments.service import get_comments_gateway_service
from test_jwt_validation import make_token

# ------------------------------------------------------------------ #
#  Fake service                                                       #
# ------------------------------------------------------------------ #

COMMENT_STUB = {
    "id": 1,
    "ownerId": -123,
    "postId": 456,
    "vkCommentId": 789,
    "text": "test comment",
    "postText": None,
    "createdAt": None,
    "isRead": False,
    "authorVkId": 98765,
    "fromId": 98765,
    "author": None,
    "matchedKeywords": [],
    "externalKey": "-123:456:789",
}


class FakeCommentsGatewayService:
    async def get_comments(self, page: int, limit: int, **kwargs):
        return {
            "items": [COMMENT_STUB],
            "total": 1,
            "hasMore": False,
            "readCount": 0,
            "unreadCount": 1,
        }

    async def get_comments_cursor(self, cursor, limit: int, **kwargs):
        return {
            "items": [COMMENT_STUB],
            "nextCursor": None,
            "hasMore": False,
            "total": 1,
            "readCount": 0,
            "unreadCount": 1,
        }

    async def patch_read_status(self, comment_id: int, *, is_read: bool, **kwargs):
        return {**COMMENT_STUB, "id": comment_id, "isRead": is_read}

    async def search_comments(self, payload: dict, **kwargs):
        return {
            "source": "fallback",
            "viewMode": payload.get("viewMode", "comments"),
            "total": 1,
            "page": payload.get("page", 1),
            "pageSize": payload.get("pageSize", 20),
            "items": [
                {
                    "type": "comment",
                    "commentId": 1,
                    "postId": 456,
                    "commentText": "test comment",
                    "postText": None,
                    "highlight": [],
                }
            ],
        }


def fake_service():
    return FakeCommentsGatewayService()


def make_authed_client_ctx(app, token: str):
    """Return AsyncClient context manager with Authorization header."""
    return AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        headers={"Authorization": f"Bearer {token}"},
    )


@pytest.fixture(autouse=True)
def inject_jwks_cache(request):
    """Before each test: generate a fresh key-pair and set it as the JWKS cache,
    so require_auth validates against the returned token without any network calls.
    After the test: restore original cache value."""
    old_cache = _security._jwks_cache
    _token, jwks = make_token()
    _security._jwks_cache = jwks
    request.node._test_token = _token
    yield
    _security._jwks_cache = old_cache


def _token(request) -> str:
    """Retrieve the per-test token stored by inject_jwks_cache."""
    return request.node._test_token


# ------------------------------------------------------------------ #
#  Route registration                                                 #
# ------------------------------------------------------------------ #

@pytest.mark.asyncio
async def test_comments_routes_registered():
    app = create_app()
    routes = [route.path for route in app.routes]
    assert "/api/v1/comments" in routes
    assert "/api/v1/comments/cursor" in routes
    assert "/api/v1/comments/{id}/read" in routes
    assert "/api/v1/comments/search" in routes


# ------------------------------------------------------------------ #
#  Auth guard                                                         #
# ------------------------------------------------------------------ #

@pytest.mark.asyncio
async def test_comments_require_auth():
    app = create_app()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/comments")
    assert response.status_code == 401


# ------------------------------------------------------------------ #
#  GET /api/v1/comments – camelCase adapter                           #
# ------------------------------------------------------------------ #

@pytest.mark.asyncio
async def test_list_comments_returns_camel_case(request):
    token = _token(request)
    app = create_app()
    app.dependency_overrides[get_comments_gateway_service] = fake_service

    async with make_authed_client_ctx(app, token) as client:
        response = await client.get("/api/v1/comments?offset=0&limit=20")

    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "hasMore" in data, "Gateway must map has_more -> hasMore"
    assert "readCount" in data, "Gateway must map read_count -> readCount"
    assert "unreadCount" in data, "Gateway must map unread_count -> unreadCount"
    assert "total" in data
    assert "next_cursor" not in data, "snake_case must not leak to frontend"
    assert "has_more" not in data, "snake_case must not leak to frontend"


@pytest.mark.asyncio
async def test_list_comments_multi_value_keywords(request):
    """Multiple keywords must be preserved, not collapsed into one."""
    token = _token(request)
    app = create_app()
    app.dependency_overrides[get_comments_gateway_service] = fake_service

    async with make_authed_client_ctx(app, token) as client:
        response = await client.get("/api/v1/comments?keywords=foo&keywords=bar")
    assert response.status_code == 200


# ------------------------------------------------------------------ #
#  GET /api/v1/comments/cursor                                        #
# ------------------------------------------------------------------ #

@pytest.mark.asyncio
async def test_comments_cursor_returns_camel_case(request):
    token = _token(request)
    app = create_app()
    app.dependency_overrides[get_comments_gateway_service] = fake_service

    async with make_authed_client_ctx(app, token) as client:
        response = await client.get("/api/v1/comments/cursor")

    assert response.status_code == 200
    data = response.json()
    assert "nextCursor" in data, "Gateway must map next_cursor -> nextCursor"
    assert "hasMore" in data
    assert "readCount" in data
    assert "unreadCount" in data
    assert "next_cursor" not in data, "snake_case must not leak to frontend"


# ------------------------------------------------------------------ #
#  PATCH /api/v1/comments/{id}/read                                   #
# ------------------------------------------------------------------ #

@pytest.mark.asyncio
async def test_patch_read_status_accepts_camel_case_payload(request):
    token = _token(request)
    app = create_app()
    app.dependency_overrides[get_comments_gateway_service] = fake_service

    async with make_authed_client_ctx(app, token) as client:
        response = await client.patch("/api/v1/comments/42/read", json={"isRead": True})

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 42
    assert data["isRead"] is True


# ------------------------------------------------------------------ #
#  POST /api/v1/comments/search                                       #
# ------------------------------------------------------------------ #

@pytest.mark.asyncio
async def test_search_comments_returns_fallback_response(request):
    token = _token(request)
    app = create_app()
    app.dependency_overrides[get_comments_gateway_service] = fake_service

    async with make_authed_client_ctx(app, token) as client:
        response = await client.post(
            "/api/v1/comments/search",
            json={"query": "тест", "viewMode": "comments", "page": 1, "pageSize": 20},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["source"] == "fallback"
    assert data["viewMode"] == "comments"
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_search_comments_posts_view_mode(request):
    token = _token(request)
    app = create_app()
    app.dependency_overrides[get_comments_gateway_service] = fake_service

    async with make_authed_client_ctx(app, token) as client:
        response = await client.post(
            "/api/v1/comments/search",
            json={"query": "тест", "viewMode": "posts"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["viewMode"] == "posts"


# ------------------------------------------------------------------ #
#  Security: internal token must not leak                            #
# ------------------------------------------------------------------ #

@pytest.mark.asyncio
async def test_internal_token_not_in_response(request):
    """The X-Internal-Service-Token must not appear in any response body."""
    token = _token(request)
    app = create_app()
    app.dependency_overrides[get_comments_gateway_service] = fake_service

    async with make_authed_client_ctx(app, token) as client:
        response = await client.get("/api/v1/comments")

    body = response.text
    assert "X-Internal-Service-Token" not in body
    assert "internal_service_token" not in body
