from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.content.author_repository import AuthorRepository
from app.modules.content.group_repository import GroupRepository
from app.modules.content.message_repository import MessageRepository


class ContentRepository:
    def __init__(self, session: AsyncSession):
        self._groups = GroupRepository(session)
        self._authors = AuthorRepository(session)
        self._messages = MessageRepository(session)

    async def list_groups(
        self,
        page: int,
        limit: int,
        search: str | None = None,
        sort_by: str | None = None,
        sort_order: str = "desc",
    ) -> dict:
        return await self._groups.list_groups(page, limit, search, sort_by, sort_order)

    async def get_group(self, vk_group_id: int) -> dict | None:
        return await self._groups.get_group(vk_group_id)

    async def search_groups(self, query: str, limit: int) -> dict:
        return await self._groups.search_groups(query, limit)

    async def upsert_group(self, group: dict) -> None:
        await self._groups.upsert_group(group)

    async def list_groups_bulk(self, vk_group_ids: list[int]) -> list[dict]:
        return await self._groups.list_groups_bulk(vk_group_ids)

    async def delete_group_and_related(self, vk_group_id: int) -> None:
        await self._groups.delete_group_and_related(vk_group_id)

    async def list_posts(self, page: int, limit: int) -> dict:
        return await self._messages.list_posts(page, limit)

    async def get_post(self, external_key: str) -> dict | None:
        return await self._messages.get_post(external_key)

    async def list_posts_bulk(self, external_keys: list[str]) -> list[dict]:
        return await self._messages.list_posts_bulk(external_keys)

    async def list_comments(self, page: int, limit: int) -> dict:
        return await self._messages.list_comments(page, limit)

    async def list_authors(
        self,
        offset: int = 0,
        limit: int = 20,
        search: str | None = None,
        city: str | None = None,
        verified: bool | None = None,
        author_type: str | None = None,
        sort_by: str | None = None,
        sort_order: str = "desc",
    ) -> dict:
        return await self._authors.list_authors(
            offset, limit, search, city, verified, author_type, sort_by, sort_order
        )

    async def get_author(self, vk_author_id: int) -> dict | None:
        return await self._authors.get_author(vk_author_id)

    async def list_authors_bulk(self, vk_author_ids: list[int]) -> list[dict]:
        return await self._authors.list_authors_bulk(vk_author_ids)

    async def _update_author_verified_at(self, vk_author_id: int) -> bool:
        return await self._authors._update_author_verified_at(vk_author_id)

    async def get_all_author_ids(self) -> list[int]:
        return await self._authors.get_all_author_ids()

    async def bulk_update_author_profiles(self, profiles: list[dict]) -> int:
        return await self._authors.bulk_update_author_profiles(profiles)

    async def delete_author_and_comments(self, vk_author_id: int) -> None:
        await self._authors.delete_author_and_comments(vk_author_id)
