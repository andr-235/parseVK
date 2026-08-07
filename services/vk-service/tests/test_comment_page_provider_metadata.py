from unittest.mock import AsyncMock

import pytest

from app.infrastructure.vk_client.posts import PostsClient


@pytest.mark.anyio
async def test_comment_iterator_preserves_provider_metadata():
    call_method = AsyncMock(
        return_value={
            "items": [{"id": 1, "from_id": 2}],
            "profiles": [],
            "groups": [],
            "count": 1,
            "current_level_count": 1,
        }
    )
    client = PostsClient(call_method=call_method)

    pages = [page async for page in client.iter_comment_pages(-10, 20)]

    assert pages == [
        {
            "items": [{"id": 1, "from_id": 2}],
            "profiles": [],
            "groups": [],
            "count": 1,
            "current_level_count": 1,
        }
    ]
