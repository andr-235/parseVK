from datetime import datetime
from app.infrastructure.vk_client import api_methods
from app.infrastructure.vk_client.base import VkApiAdapter, VkApiBaseClient, VkApiConfigurationError

__all__ = ["VkApiClient", "VkApiAdapter", "VkApiConfigurationError"]

class VkApiClient(VkApiBaseClient):
    async def get_groups(self, group_ids: list[int], fields: list[str] | None = None) -> list[dict]:
        return await api_methods.get_groups(self._call, group_ids, fields)

    async def get_posts(self, group_id: int, *, mode: str, post_limit: int | None) -> dict:
        return await api_methods.get_posts(self._call, group_id, mode=mode, post_limit=post_limit)

    async def get_comments(self, owner_id: int, post_id: int) -> dict:
        return await api_methods.get_comments(self._call, owner_id, post_id)

    async def search_groups_by_region(self, *, query: str | None = None) -> list[dict]:
        return await api_methods.search_groups_by_region(self._call, query=query)

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
        return await api_methods.get_author_comments_for_post(
            self._call, owner_id, post_id, author_vk_id,
            baseline=baseline, batch_size=batch_size,
            max_pages=max_pages, thread_items_count=thread_items_count,
        )

    async def get_user_photos(self, user_id: int, count: int = 100, offset: int = 0) -> list[dict]:
        return await api_methods.get_user_photos(self._call, user_id, count=count, offset=offset)

    async def get_users(self, user_ids: list[int], fields: list[str]) -> list[dict]:
        return await api_methods.get_users(self._call, user_ids, fields)

    async def friends_get(self, **params) -> dict:
        return await api_methods.friends_get(self._call, **params)
