import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.domain.content.errors import InvalidFilterError
from app.infrastructure.db.mappers.authors import author_to_dict, split_display_name
from app.infrastructure.db.mappers.groups import normalize_group_fields
from app.services.content.author_commands import AuthorCommandService
from app.services.content.authors import AuthorQueryService
from app.services.content.groups import GroupService
from app.services.content.posts import PostService


@pytest.fixture
def anyio_backend():
    return "asyncio"


# --- GroupContentService Tests ---

@pytest.mark.anyio
async def test_group_service_list_normalization():
    mock_repo = AsyncMock()
    mock_repo.list_groups.return_value = {"items": [], "total": 0}
    service = GroupService(mock_repo)

    await service.list_groups(page=1, limit=10, search="  my group  ", sort_order="invalid")

    mock_repo.list_groups.assert_called_once_with(
        page=1,
        limit=10,
        search="my group",
        sort_by=None,
        sort_order="desc",  # "invalid" normalized to "desc"
    )


@pytest.mark.anyio
async def test_group_service_delete_group_flow():
    mock_repo = AsyncMock()
    service = GroupService(mock_repo)

    # Case 1: Group not found
    mock_repo.get_group.return_value = None
    assert await service.delete_group(123) is False
    mock_repo.delete_group_and_related.assert_not_called()

    # Case 2: Group found
    mock_repo.get_group.return_value = {"id": 123}
    assert await service.delete_group(123) is True
    mock_repo.delete_group_and_related.assert_called_once_with(123)


@pytest.mark.anyio
async def test_group_service_save_group():
    mock_repo = AsyncMock()
    service = GroupService(mock_repo)
    group_data = {"id": 456, "name": "Test Group"}
    mock_repo.get_group.return_value = {"id": 456, "name": "Test Group"}

    result = await service.save_group(group_data)
    assert result == {"id": 456, "name": "Test Group"}
    mock_repo.upsert_group.assert_called_once_with(group_data)


# --- PostContentService Tests ---

@pytest.mark.anyio
async def test_post_service_forward_calls():
    mock_repo = AsyncMock()
    service = PostService(mock_repo)

    mock_repo.list_posts.return_value = {"items": []}
    mock_repo.get_post.return_value = {"id": "123"}
    mock_repo.list_comments.return_value = {"items": []}
    mock_repo.list_posts_bulk.return_value = []

    await service.list_posts(1, 10)
    await service.get_post("ext_key")
    await service.list_comments(1, 5)
    await service.list_posts_bulk(["key1"])

    mock_repo.list_posts.assert_called_once_with(1, 10)
    mock_repo.get_post.assert_called_once_with("ext_key")
    mock_repo.list_comments.assert_called_once_with(1, 5)
    mock_repo.list_posts_bulk.assert_called_once_with(["key1"])


# --- AuthorContentService Tests ---

@pytest.mark.anyio
async def test_author_service_validation():
    mock_repo = AsyncMock()
    service = AuthorQueryService(mock_repo)

    # Invalid sort field
    with pytest.raises(InvalidFilterError):
        await service.list_authors(sort_by="invalid_field")

    # Valid sort field
    mock_repo.list_authors.return_value = {"items": []}
    await service.list_authors(sort_by="followersCount")
    mock_repo.list_authors.assert_called_once()


@pytest.mark.anyio
async def test_author_service_enrichment():
    mock_repo = AsyncMock()
    mock_photo_analysis = AsyncMock()
    mock_photo_analysis.enrichment_budget_seconds = 2.0
    service = AuthorQueryService(mock_repo, mock_photo_analysis)

    mock_repo.get_author.return_value = {"vkUserId": 777, "displayName": "Alex"}
    mock_photo_analysis.summaries_by_vk_author_ids.return_value = {
        777: {"total": 5, "details": "some data"}
    }

    author = await service.get_author(777)
    assert author["summary"] == {"total": 5, "details": "some data"}
    assert author["photosCount"] == 5


@pytest.mark.anyio
async def test_author_service_delete():
    mock_repo = AsyncMock()
    service = AuthorCommandService(mock_repo)

    mock_repo.get_author.return_value = None
    assert await service.delete_author(999) is False

    mock_repo.get_author.return_value = {"vkUserId": 999}
    assert await service.delete_author(999) is True
    mock_repo.delete_author_and_comments.assert_called_once_with(999)


# --- Helper & Mapper Tests ---

def test_split_display_name_helper():
    assert split_display_name("Ivan Ivanov") == ("Ivan", "Ivanov")
    assert split_display_name("SingleName") == ("SingleName", "")
    assert split_display_name("") == ("", "")


def test_author_to_dict_mapping():
    mock_row = MagicMock()
    mock_row.id = 1
    mock_row.vk_author_id = 12345
    mock_row.type = "user"
    mock_row.display_name = "Alex Green"
    mock_row.first_name = "Alex"
    mock_row.last_name = "Green"
    mock_row.photo_50 = "http://photo50"
    mock_row.photo_100 = "http://photo100"
    mock_row.photo_200 = "http://photo200"
    mock_row.domain = "alexgreen"
    mock_row.screen_name = "alex.green"
    mock_row.city = {"id": 1, "title": "Moscow"}
    mock_row.country = {"id": 1, "title": "Russia"}
    mock_row.followers_count = 100
    mock_row.verified_at = None
    mock_row.created_at = None
    mock_row.updated_at = None

    result = author_to_dict(mock_row)
    assert result["id"] == 1
    assert result["vkAuthorId"] == 12345
    assert result["fullName"] == "Alex Green"
    assert result["firstName"] == "Alex"
    assert result["lastName"] == "Green"
    assert result["isVerified"] is False


def test_normalize_group_fields_helper():
    group_data = {
        "id": 999,
        "name": "Test Group",
        "screen_name": "test_group",
        "is_closed": 0,
        "type": "group",
        "photo_50": "http://50",
        "photo_100": "http://100",
        "photo_200": "http://200",
    }
    res = normalize_group_fields(group_data)
    assert res["vk_group_id"] == 999
    assert res["name"] == "Test Group"
    assert res["screen_name"] == "test_group"
    assert res["is_closed"] == 0
    assert res["type"] == "group"
