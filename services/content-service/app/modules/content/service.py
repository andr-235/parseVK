import logging

from .author_service import AuthorContentService, AuthorRepositoryProto
from .group_service import GroupContentService, GroupRepositoryProto
from .post_service import PostContentService, PostRepositoryProto

logger = logging.getLogger(__name__)


class ContentService:
    def __init__(
        self,
        *,
        group_repo: GroupRepositoryProto,
        post_repo: PostRepositoryProto,
        author_repo: AuthorRepositoryProto,
        photo_analysis=None,
    ):
        logger.info("[FIX] Initializing ContentService simplified facade with direct repositories")
        self._groups = GroupContentService(group_repo)
        self._posts = PostContentService(post_repo)
        self._authors = AuthorContentService(author_repo, photo_analysis)

    async def list_groups(
        self,
        page: int,
        limit: int,
        search: str | None = None,
        sort_by: str | None = None,
        sort_order: str = "desc",
    ) -> dict:
        return await self._groups.list_groups(page, limit, search, sort_by, sort_order)

    async def search_groups(self, q: str, limit: int) -> dict:
        return await self._groups.search_groups(q, limit)

    async def get_group(self, vk_group_id: int) -> dict | None:
        return await self._groups.get_group(vk_group_id)

    async def list_posts(self, page: int, limit: int) -> dict:
        return await self._posts.list_posts(page, limit)

    async def get_post(self, external_key: str) -> dict | None:
        return await self._posts.get_post(external_key)

    async def list_comments(self, page: int, limit: int) -> dict:
        return await self._posts.list_comments(page, limit)

    async def list_authors(
        self,
        limit: int = 20,
        page: int | None = None,
        offset: int | None = None,
        search: str | None = None,
        city: str | None = None,
        verified: str | None = None,
        author_type: str | None = None,
        sort_by: str | None = None,
        sort_order: str = "desc",
    ) -> dict:
        return await self._authors.list_authors(
            limit=limit, page=page, offset=offset, search=search,
            city=city, verified=verified, author_type=author_type,
            sort_by=sort_by, sort_order=sort_order,
        )

    async def get_author(self, vk_author_id: int) -> dict | None:
        return await self._authors.get_author(vk_author_id)

    async def list_authors_bulk(self, vk_author_ids: list[int]) -> list[dict]:
        return await self._authors.list_authors_bulk(vk_author_ids)

    async def verify_author(self, vk_author_id: int) -> bool:
        return await self._authors.verify_author(vk_author_id)

    async def delete_group(self, vk_group_id: int) -> bool:
        return await self._groups.delete_group(vk_group_id)

    async def delete_author(self, vk_author_id: int) -> bool:
        return await self._authors.delete_author(vk_author_id)

    async def refresh_authors(self) -> int:
        return await self._authors.refresh_authors()

    async def list_posts_bulk(self, external_keys: list[str]) -> list[dict]:
        return await self._posts.list_posts_bulk(external_keys)

    async def list_groups_bulk(self, vk_group_ids: list[int]) -> list[dict]:
        return await self._groups.list_groups_bulk(vk_group_ids)

    async def save_group(self, group: dict) -> dict:
        return await self._groups.save_group(group)
