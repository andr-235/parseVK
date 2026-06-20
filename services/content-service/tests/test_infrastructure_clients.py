import httpx
import pytest
from app.infrastructure.clients.moderation import ModerationPhotoSummaryClient
from app.infrastructure.clients.vk import VkProfilesHttpClient


@pytest.mark.anyio
async def test_vk_profiles_client_reuses_injected_http_client():
    async def handler(request: httpx.Request):
        assert request.headers["X-Internal-Service-Token"] == "token"
        return httpx.Response(200, json=[{"id": 101}])

    async with httpx.AsyncClient(
        transport=httpx.MockTransport(handler),
        base_url="http://vk-service:8000",
    ) as client:
        adapter = VkProfilesHttpClient(client, internal_token="token")
        result = await adapter.get_profiles([101], ["city"])

    assert result == [{"id": 101}]


@pytest.mark.anyio
async def test_moderation_client_uses_bulk_summary_contract():
    async def handler(request: httpx.Request):
        assert request.url.path == "/photo-analysis/bulk-summaries"
        return httpx.Response(200, json={"101": {"total": 2}})

    async with httpx.AsyncClient(
        transport=httpx.MockTransport(handler),
        base_url="http://moderation-service:8000",
    ) as client:
        adapter = ModerationPhotoSummaryClient(
            client,
            internal_token="token",
            enrichment_budget_seconds=2.0,
        )
        result = await adapter.summaries_by_vk_author_ids([101])

    assert result == {101: {"total": 2}}
