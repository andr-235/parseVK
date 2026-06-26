import logging

from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ImKeyword

logger = logging.getLogger(__name__)


class KeywordsRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def add(self, user_id: str, messenger: str, keyword: str) -> ImKeyword | None:
        stmt = (
            insert(ImKeyword)
            .values(messenger=messenger, user_id=user_id, keyword=keyword)
            .on_conflict_do_nothing(
                constraint="uq_im_keywords_messenger_user_keyword",
            )
            .returning(ImKeyword)
        )
        result = await self.session.execute(stmt)
        row = result.scalar_one_or_none()
        if row:
            logger.info("Keyword added: messenger=%s user_id=%s keyword=%s", messenger, user_id, keyword)
        else:
            logger.info("Keyword duplicate skipped: messenger=%s user_id=%s keyword=%s", messenger, user_id, keyword)
        return row

    async def list_by_user(self, user_id: str, messenger: str | None = None) -> list[ImKeyword]:
        stmt = select(ImKeyword).where(ImKeyword.user_id == user_id)
        if messenger:
            stmt = stmt.where(ImKeyword.messenger == messenger)
        stmt = stmt.order_by(ImKeyword.created_at)
        result = await self.session.scalars(stmt)
        return list(result.all())

    async def delete(self, keyword_id: int, user_id: str) -> bool:
        stmt = (
            delete(ImKeyword)
            .where(ImKeyword.id == keyword_id, ImKeyword.user_id == user_id)
        )
        result = await self.session.execute(stmt)
        if result.rowcount > 0:
            logger.info("Keyword deleted: id=%d user_id=%s", keyword_id, user_id)
            return True
        logger.info("Keyword not found for deletion: id=%d user_id=%s", keyword_id, user_id)
        return False
