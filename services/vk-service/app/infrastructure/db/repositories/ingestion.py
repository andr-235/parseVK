from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.repositories.ingestion import IngestionRepository
from app.infrastructure.db.repositories.authors import SqlAlchemyAuthorRepository
from app.infrastructure.db.repositories.comments import SqlAlchemyCommentRepository
from app.infrastructure.db.repositories.groups import SqlAlchemyGroupRepository
from app.infrastructure.db.repositories.posts import SqlAlchemyPostRepository


class SqlAlchemyIngestionRepository(IngestionRepository):
    def __init__(self, session: AsyncSession):
        self._groups = SqlAlchemyGroupRepository(session)
        self._authors = SqlAlchemyAuthorRepository(session)
        self._posts = SqlAlchemyPostRepository(session)
        self._comments = SqlAlchemyCommentRepository(session)

    async def upsert_group(self, group: dict, revive_if_deleted: bool = False) -> None:
        await self._groups.upsert_group(group, revive_if_deleted=revive_if_deleted)

    async def get_active_group_ids(self) -> list[int]:
        return await self._groups.get_active_group_ids()

    async def soft_delete_group(self, vk_group_id: int) -> bool:
        return await self._groups.soft_delete_group(vk_group_id)

    async def upsert_author(self, author: dict) -> None:
        await self._authors.upsert_author(author)

    async def upsert_post(self, post: dict, task_id: int, group_id: int | None = None) -> None:
        await self._posts.upsert_post(post, task_id, group_id=group_id)

    async def upsert_comment(self, comment: dict, task_id: int) -> None:
        await self._comments.upsert_comment(comment, task_id)
