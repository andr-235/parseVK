import sys
from pathlib import Path
from unittest.mock import AsyncMock

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.modules.vk_api.client import VkApiClient


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
