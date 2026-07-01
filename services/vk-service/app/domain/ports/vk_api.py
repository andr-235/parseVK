from datetime import datetime
from typing import Protocol


class VkApiPort(Protocol):
    """Port (interface) for VK API access. Belongs in the domain layer."""

    async def get_groups(self, group_ids: list[int], fields: list[str] | None = None) -> list[dict]:
        ...

    async def get_posts(self, group_id: int, *, mode: str, post_limit: int | None) -> dict:
        ...

    async def get_comments(self, owner_id: int, post_id: int) -> dict:
        ...

    async def search_groups_by_region(self, *, query: str | None = None) -> list[dict]:
        ...

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
        ...

    async def get_user_photos(self, user_id: int, count: int = 100, offset: int = 0) -> list[dict]:
        ...

    async def get_users(self, user_ids: list[int], fields: list[str]) -> list[dict]:
        ...

    async def friends_get(self, **params) -> dict:
        ...

    async def test_token(self) -> dict:
        ...
