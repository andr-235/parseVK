import logging

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ImMessage

logger = logging.getLogger(__name__)


class SearchRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def search_messages(
        self,
        messenger: str | None,
        query: str | None,
        chat_id: str | None,
        author: str | None,
        page: int,
        limit: int,
    ) -> tuple[list[ImMessage], int]:
        conditions = []

        if messenger:
            conditions.append(ImMessage.messenger == messenger)
        if query:
            conditions.append(ImMessage.text.ilike(f"%{query}%"))
        if chat_id:
            conditions.append(ImMessage.chat_external_id == chat_id)
        if author:
            conditions.append(ImMessage.author.ilike(f"%{author}%"))

        base = select(ImMessage)
        if conditions:
            base = base.where(and_(*conditions))

        count_q = select(func.count()).select_from(base.subquery())
        total = await self.session.scalar(count_q) or 0

        offset = (page - 1) * limit
        stmt = base.order_by(ImMessage.created_at.desc().nullslast()).offset(offset).limit(limit)
        result = await self.session.scalars(stmt)
        return list(result.all()), total

    async def search_by_keywords(
        self,
        user_id: str,
        messenger: str | None,
        page: int,
        limit: int,
    ) -> tuple[list[ImMessage], int]:
        from app.db.models import ImKeyword

        kw_stmt = select(ImKeyword.keyword).where(ImKeyword.user_id == user_id)
        if messenger:
            kw_stmt = kw_stmt.where(ImKeyword.messenger == messenger)
        kw_result = await self.session.scalars(kw_stmt)
        keywords = list(kw_result.all())

        if not keywords:
            return [], 0

        patterns = [f"%{kw}%" for kw in keywords]
        conditions = [ImMessage.text.ilike(p) for p in patterns]

        base = select(ImMessage)
        if messenger:
            base = base.where(ImMessage.messenger == messenger)
        base = base.where(or_(*conditions))

        count_q = select(func.count()).select_from(base.subquery())
        total = await self.session.scalar(count_q) or 0

        offset = (page - 1) * limit
        stmt = base.order_by(ImMessage.created_at.desc().nullslast()).offset(offset).limit(limit)
        result = await self.session.scalars(stmt)
        return list(result.all()), total
