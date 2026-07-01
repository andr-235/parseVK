import sys
from pathlib import Path
from unittest.mock import AsyncMock

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.infrastructure.vk_client.client import VkApiClient


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_search_groups_by_region_filters_by_city_id():
    # Создаем клиент
    client = VkApiClient(token="fake-token")
    
    # Мокаем внутренний метод _call
    mock_call = AsyncMock()
    client._call = mock_call
    
    # Описываем возвращаемые значения для последовательности вызовов
    async def mock_call_side_effect(method, **params):
        if method == "database.getRegions":
            return {"items": [{"id": 100, "title": "Еврейская автономная область"}]}
            
        elif method == "database.getCities":
            assert params.get("region_id") == 100
            return {
                "items": [
                    {"id": 1, "title": "Биробиджан"},
                    {"id": 2, "title": "Облучье"}
                ],
                "count": 2
            }
            
        elif method == "groups.search":
            city_id = params.get("city_id")
            if city_id == 1:
                return {"items": [{"id": 10, "name": "Группа Биробиджана"}]}
            elif city_id == 2:
                return {"items": [{"id": 20, "name": "Группа Облучья"}]}
            return {"items": []}
            
        elif method == "groups.getById":
            # Имитируем обогащение. 
            # Группа 10 имеет правильный city (id=1, Биробиджан)
            # Группа 20 имеет неправильный city (id=3, Облучье в другой области)
            return {
                "groups": [
                    {
                        "id": 10,
                        "name": "Группа Биробиджана",
                        "city": {"id": 1, "title": "Биробиджан"}
                    },
                    {
                        "id": 20,
                        "name": "Группа Облучья",
                        "city": {"id": 3, "title": "Облучье (Другой Регион)"}
                    }
                ]
            }
        return {}

    mock_call.side_effect = mock_call_side_effect

    # Вызываем метод
    results = await client.search_groups_by_region(query="тест")

    # Проверяем, что группа 20 (из другого региона) была отфильтрована
    assert len(results) == 1
    assert results[0]["id"] == 10
    assert results[0]["name"] == "Группа Биробиджана"
    assert results[0]["city"]["id"] == 1


@pytest.mark.anyio
async def test_search_groups_by_region_uses_city_title_for_empty_query():
    client = VkApiClient(token="fake-token")
    mock_call = AsyncMock()
    client._call = mock_call
    
    searched_queries = {}
    
    async def mock_call_side_effect(method, **params):
        if method == "database.getRegions":
            return {"items": [{"id": 100, "title": "Еврейская автономная область"}]}
        elif method == "database.getCities":
            return {
                "items": [
                    {"id": 1, "title": "Биробиджан"},
                    {"id": 2, "title": "Облучье"}
                ],
                "count": 2
            }
        elif method == "groups.search":
            city_id = params.get("city_id")
            q = params.get("q")
            searched_queries[city_id] = q
            return {"items": [{"id": city_id * 10, "name": f"Группа {q}"}]}
        elif method == "groups.getById":
            return {
                "groups": [
                    {"id": 10, "name": "Группа Биробиджан", "city": {"id": 1, "title": "Биробиджан"}},
                    {"id": 20, "name": "Группа Облучье", "city": {"id": 2, "title": "Облучье"}}
                ]
            }
        return {}

    mock_call.side_effect = mock_call_side_effect

    # Ищем без query
    results = await client.search_groups_by_region(query="")

    # Проверяем, что q для каждого города соответствовал названию этого города
    assert searched_queries[1] == "Биробиджан"
    assert searched_queries[2] == "Облучье"
    assert len(results) == 2


# ---------------------------------------------------------------------------
# Parameter capture tests for remaining API methods
# ---------------------------------------------------------------------------

class TestVkApiMethodParams:
    """Verify each public method passes correct method name and params to _call."""

    @pytest.fixture
    def client(self):
        return VkApiClient(token="fake-token")

    @pytest.mark.anyio
    async def test_get_user_photos_passes_correct_params(self, client):
        mock_call = AsyncMock(return_value={"items": [{"id": 1}]})
        client._users._call = mock_call

        result = await client.get_user_photos(123, count=5, offset=10)

        assert result == [{"id": 1}]
        mock_call.assert_awaited_once_with(
            "photos.getAll",
            owner_id=123, count=5, offset=10, extended=0, photo_sizes=1,
        )

    @pytest.mark.anyio
    async def test_get_users_passes_correct_params(self, client):
        mock_call = AsyncMock(return_value=[{"id": 1, "first_name": "John"}])
        client._users._call = mock_call

        result = await client.get_users([1, 2, 3], fields=["photo_50", "domain"])

        assert len(result) == 1
        mock_call.assert_awaited_once_with(
            "users.get",
            user_ids="1,2,3", fields="photo_50,domain",
        )

    @pytest.mark.anyio
    async def test_friends_get_passes_correct_params(self, client):
        mock_call = AsyncMock(return_value={"items": [{"id": 1}]})
        client._friends._call = mock_call

        result = await client.friends_get(user_id=123, count=10)

        assert result == {"items": [{"id": 1}]}
        mock_call.assert_awaited_once_with("friends.get", user_id=123, count=10)

    @pytest.mark.anyio
    async def test_test_token_passes_correct_params(self, client):
        mock_call = AsyncMock(return_value=[{"id": 1}])
        client._users._call = mock_call

        result = await client.test_token()

        assert result == [{"id": 1}]
        mock_call.assert_awaited_once_with("users.get", user_ids="1")

    @pytest.mark.anyio
    async def test_get_author_comments_passes_correct_params(self, client):
        mock_call = AsyncMock(return_value={
            "items": [{"id": 1, "from_id": 100, "date": 1000}],
            "count": 1,
        })
        client._posts._call = mock_call

        result = await client.get_author_comments_for_post(
            owner_id=-1, post_id=42, author_vk_id=100,
            baseline=None, batch_size=100, max_pages=1, thread_items_count=10,
        )

        assert len(result) == 1
        mock_call.assert_awaited_once_with(
            "wall.getComments",
            owner_id=-1, post_id=42, need_likes=0, extended=0,
            count=100, offset=0, sort="desc", thread_items_count=10,
        )
