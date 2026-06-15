from .crud_service import ContentCrudService, ContentRepo


class ContentService:
    def __init__(self, *, repo: ContentRepo, photo_analysis=None):
        _crud = ContentCrudService(repo=repo, photo_analysis=photo_analysis)
        self._list_groups = lambda *a, **kw: _crud.list_groups(*a, **kw)
        self._search_groups = lambda *a, **kw: _crud.search_groups(*a, **kw)
        self._get_group = lambda *a, **kw: _crud.get_group(*a, **kw)
        self._list_posts = lambda *a, **kw: _crud.list_posts(*a, **kw)
        self._get_post = lambda *a, **kw: _crud.get_post(*a, **kw)
        self._list_comments = lambda *a, **kw: _crud.list_comments(*a, **kw)
        self._list_authors = lambda *a, **kw: _crud.list_authors(*a, **kw)
        self._get_author = lambda *a, **kw: _crud.get_author(*a, **kw)
        self._list_authors_bulk = lambda *a, **kw: _crud.list_authors_bulk(*a, **kw)
        self._verify_author = lambda *a, **kw: _crud.verify_author(*a, **kw)
        self._delete_group = lambda *a, **kw: _crud.delete_group(*a, **kw)
        self._delete_author = lambda *a, **kw: _crud.delete_author(*a, **kw)
        self._refresh_authors = lambda *a, **kw: _crud.refresh_authors(*a, **kw)
        self._list_posts_bulk = lambda *a, **kw: _crud.list_posts_bulk(*a, **kw)
        self._list_groups_bulk = lambda *a, **kw: _crud.list_groups_bulk(*a, **kw)
        self._save_group = lambda *a, **kw: _crud.save_group(*a, **kw)

    async def list_groups(
        self,
        page: int,
        limit: int,
        search: str | None = None,
        sort_by: str | None = None,
        sort_order: str = "desc",
    ) -> dict:
        return await self._list_groups(page, limit, search, sort_by, sort_order)

    async def search_groups(self, q: str, limit: int) -> dict:
        return await self._search_groups(q, limit)

    async def get_group(self, vk_group_id: int) -> dict | None:
        return await self._get_group(vk_group_id)

    async def list_posts(self, page: int, limit: int) -> dict:
        return await self._list_posts(page, limit)

    async def get_post(self, external_key: str) -> dict | None:
        return await self._get_post(external_key)

    async def list_comments(self, page: int, limit: int) -> dict:
        return await self._list_comments(page, limit)

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
        return await self._list_authors(
            limit=limit, page=page, offset=offset, search=search,
            city=city, verified=verified, author_type=author_type,
            sort_by=sort_by, sort_order=sort_order,
        )

    async def get_author(self, vk_author_id: int) -> dict | None:
        return await self._get_author(vk_author_id)

    async def list_authors_bulk(self, vk_author_ids: list[int]) -> list[dict]:
        return await self._list_authors_bulk(vk_author_ids)

    async def verify_author(self, vk_author_id: int) -> bool:
        return await self._verify_author(vk_author_id)

    async def delete_group(self, vk_group_id: int) -> bool:
        return await self._delete_group(vk_group_id)

    async def delete_author(self, vk_author_id: int) -> bool:
        return await self._delete_author(vk_author_id)

    async def refresh_authors(self) -> int:
        return await self._refresh_authors()

    async def list_posts_bulk(self, external_keys: list[str]) -> list[dict]:
        return await self._list_posts_bulk(external_keys)

    async def list_groups_bulk(self, vk_group_ids: list[int]) -> list[dict]:
        return await self._list_groups_bulk(vk_group_ids)

    async def save_group(self, group: dict) -> dict:
        return await self._save_group(group)
