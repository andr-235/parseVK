import logging
from collections.abc import AsyncIterator
from datetime import datetime

from app.domain.ports.vk_api import VkApiPort
from app.infrastructure.vk_client.base import VkApiBaseClient, VkApiConfigurationError
from app.infrastructure.vk_client.friends import FriendsClient
from app.infrastructure.vk_client.groups import GroupsClient
from app.infrastructure.vk_client.posts import PostsClient
from app.infrastructure.vk_client.users import UsersClient

# Re-export for backward compatibility
VkApiAdapter = VkApiPort

logger = logging.getLogger(__name__)

__all__ = ["VkApiClient", "VkApiAdapter", "VkApiConfigurationError"]


class VkApiClient(VkApiBaseClient):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._groups = GroupsClient(self._call)
        self._posts = PostsClient(self._call)
        self._users = UsersClient(self._call)
        self._friends = FriendsClient(self._call)

    async def get_groups(self, group_ids: list[int], fields: list[str] | None = None) -> list[dict]:
        return await self._groups.get_groups(group_ids, fields=fields)

    async def search_groups_by_region(self, *, query: str | None = None) -> list[dict]:
        return await self._groups.search_groups_by_region(query=query)

    async def get_posts(self, group_id: int, *, mode: str, post_limit: int | None) -> dict:
        return await self._posts.get_posts(group_id, mode=mode, post_limit=post_limit)

    async def get_comments(self, owner_id: int, post_id: int) -> dict:
        return await self._posts.get_comments(owner_id, post_id)

    async def iter_comment_pages(
        self,
        owner_id: int,
        post_id: int,
        start_offset: int = 0,
        page_size: int = 100,
        max_retries: int = 3,
        max_rate_limit_retries: int = 5,
        thread_items_count: int = 0,
    ) -> AsyncIterator[dict]:
        async for page in self._posts.iter_comment_pages(
            owner_id,
            post_id,
            start_offset=start_offset,
            page_size=page_size,
            max_retries=max_retries,
            max_rate_limit_retries=max_rate_limit_retries,
            thread_items_count=thread_items_count,
        ):
            yield page

    async def get_author_comments_for_post(
        self,
        owner_id: int,
        post_id: int,
        author_vk_id: int,
        baseline: datetime | None = None,
        batch_size: int = 100,
        max_pages: int = 10,
        thread_items_count: int = 10,
    ) -> list[dict]:
        return await self._posts.get_author_comments_for_post(
            owner_id,
            post_id,
            author_vk_id,
            baseline=baseline,
            batch_size=batch_size,
            max_pages=max_pages,
            thread_items_count=thread_items_count,
        )

    async def get_user_photos(self, user_id: int, count: int = 100, offset: int = 0) -> list[dict]:
        return await self._users.get_user_photos(user_id, count=count, offset=offset)

    async def get_users(self, user_ids: list[int], fields: list[str]) -> list[dict]:
        return await self._users.get_users(user_ids, fields)

    async def friends_get(self, **params) -> dict:
        return await self._friends.friends_get(**params)

    async def test_token(self) -> dict:
        return await self._users.test_token()
