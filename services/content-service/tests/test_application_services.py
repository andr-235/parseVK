from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from app.domain.content.errors import InvalidFilterError
from app.domain.events.models import ImEvent, VkEvent
from app.services.content.authors import AuthorQueryService
from app.services.content.groups import GroupService
from app.services.monitoring.groups import MonitoringGroupService
from app.services.projections.im import ImProjectionService
from app.services.projections.vk import VkProjectionService


@pytest.mark.anyio
async def test_author_query_service_normalizes_and_enriches():
    repository = AsyncMock()
    repository.list_authors.return_value = {
        "items": [{"vkUserId": 101, "summary": None}],
        "total": 1,
        "hasMore": False,
    }
    summaries = AsyncMock()
    summaries.enrichment_budget_seconds = 1.0
    summaries.summaries_by_vk_author_ids.return_value = {101: {"total": 2}}
    service = AuthorQueryService(repository, summaries)

    result = await service.list_authors(search=" Ada ", verified="true")

    assert result["items"][0]["photosCount"] == 2
    repository.list_authors.assert_awaited_once_with(
        offset=0,
        limit=20,
        search="Ada",
        city=None,
        verified=True,
        author_type=None,
        sort_by=None,
        sort_order="desc",
    )


@pytest.mark.anyio
async def test_author_query_service_rejects_unknown_sort():
    with pytest.raises(InvalidFilterError):
        await AuthorQueryService(AsyncMock()).list_authors(sort_by="photosCount")


@pytest.mark.anyio
async def test_group_service_preserves_delete_semantics():
    repository = AsyncMock()
    repository.get_group.side_effect = [None, {"vkId": 42}]
    service = GroupService(repository)

    assert await service.delete_group(42) is False
    assert await service.delete_group(42) is True
    repository.delete_group_and_related.assert_awaited_once_with(42)


@pytest.mark.anyio
async def test_monitoring_group_service_does_not_access_session():
    repository = AsyncMock()
    repository.get_group.return_value = {"id": 7}
    repository.update_group.return_value = {"id": 7, "name": "Updated"}
    service = MonitoringGroupService(repository, AsyncMock())

    result = await service.update_group(7, {"name": "Updated"})

    assert result == {"id": 7, "name": "Updated"}
    repository.update_group.assert_awaited_once_with(7, name="Updated")


def envelope(model, event_type, payload):
    return model.model_validate(
        {
            "event_id": str(uuid4()),
            "event_type": event_type,
            "event_version": 1,
            "aggregate_id": "aggregate-1",
            "correlation_id": "corr-1",
            "payload": payload,
        }
    )


@pytest.mark.anyio
async def test_vk_projection_routes_typed_event():
    repository = AsyncMock()
    repository.is_processed.return_value = False
    service = VkProjectionService(repository)
    event = envelope(VkEvent, "vk.group_deleted", {"vkGroupId": 42})

    assert await service.handle(event) is True
    repository.delete_group.assert_awaited_once_with(42)


@pytest.mark.anyio
async def test_vk_comment_projection_recalculates_count_idempotently():
    repository = AsyncMock()
    repository.is_processed.return_value = False
    service = VkProjectionService(repository)
    event = envelope(
        VkEvent,
        "vk.comment_collected",
        {"taskId": 10, "comment": {"owner_id": -1, "post_id": 3, "id": 4}},
    )

    assert await service.handle(event) is True
    repository.sync_post_comments_count.assert_awaited_once_with("-1:3")
    repository.increment_post_comments_count.assert_not_awaited()


@pytest.mark.anyio
async def test_im_projection_is_idempotent():
    repository = AsyncMock()
    repository.is_processed.side_effect = [False, True]
    service = ImProjectionService(repository)
    event = envelope(
        ImEvent,
        "im.message_collected",
        {"messenger": "whatsapp", "messageId": "m1", "chatId": "c1"},
    )

    assert await service.handle(event) is True
    assert await service.handle(event) is False
    repository.upsert_message.assert_awaited_once_with("whatsapp", "m1", "c1")
