from datetime import UTC, datetime

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.models.vk_ingestion import VkAuthor
from app.domain.repositories.authors import AuthorRepository


def utcnow() -> datetime:
    return datetime.now(UTC)

class SqlAlchemyAuthorRepository(AuthorRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def upsert_author(self, author: dict) -> None:
        now = utcnow()
        stmt = insert(VkAuthor).values(
            vk_author_id=int(author["vk_author_id"]),
            type=author["type"],
            display_name=author.get("display_name"),
            raw=author.get("raw") or author,
            first_seen_at=now,
            last_seen_at=now,
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=[VkAuthor.vk_author_id],
            set_={
                "type": stmt.excluded.type,
                "display_name": stmt.excluded.display_name,
                "raw": stmt.excluded.raw,
                "last_seen_at": now,
            },
        )
        await self.session.execute(stmt)
