from typing import Protocol


class PostRepositoryProto(Protocol):
    async def list_posts(self, page: int, limit: int) -> dict: ...
    async def get_post(self, external_key: str) -> dict | None: ...
    async def list_comments(self, page: int, limit: int) -> dict: ...
    async def list_posts_bulk(self, external_keys: list[str]) -> list[dict]: ...


class PostContentService:
    def __init__(self, repo: PostRepositoryProto):
        self._repo = repo

    async def list_posts(self, page: int, limit: int) -> dict:
        return await self._repo.list_posts(page, limit)

    async def get_post(self, external_key: str) -> dict | None:
        return await self._repo.get_post(external_key)

    async def list_comments(self, page: int, limit: int) -> dict:
        return await self._repo.list_comments(page, limit)

    async def list_posts_bulk(self, external_keys: list[str]) -> list[dict]:
        return await self._repo.list_posts_bulk(external_keys)
