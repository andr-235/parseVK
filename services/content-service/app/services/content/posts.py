from app.domain.content.repositories import PostRepository


class PostService:
    def __init__(self, repository: PostRepository):
        self.repository = repository

    async def list_posts(self, page: int, limit: int) -> dict:
        return await self.repository.list_posts(page, limit)

    async def get_post(self, external_key: str) -> dict | None:
        return await self.repository.get_post(external_key)

    async def list_comments(self, page: int, limit: int) -> dict:
        return await self.repository.list_comments(page, limit)

    async def list_posts_bulk(self, keys: list[str]) -> list[dict]:
        return await self.repository.list_posts_bulk(keys)
