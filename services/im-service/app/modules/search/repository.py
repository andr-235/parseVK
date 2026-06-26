import logging

from sqlalchemy import and_, any_, func, select
from sqlalchemy.dialects.postgresql import array
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ImMessage
from app.modules.search.schemas import SearchMessagesRequest

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

    async def search_messages_dto(
        self,
        dto: SearchMessagesRequest,
    ) -> tuple[list[ImMessage], int]:
        conditions = []

        if dto.messenger:
            conditions.append(ImMessage.messenger == dto.messenger)
        if dto.query:
            conditions.append(ImMessage.text.ilike(f"%{dto.query}%"))
        if dto.chat_id:
            conditions.append(ImMessage.chat_external_id == dto.chat_id)
        if dto.date_from:
            conditions.append(ImMessage.created_at >= dto.date_from)
        if dto.date_to:
            conditions.append(ImMessage.created_at <= dto.date_to)

        base = select(ImMessage)
        if conditions:
            base = base.where(and_(*conditions))

        if dto.only_with_keywords and dto.keywords:
            patterns = [f"%{kw}%" for kw in dto.keywords]
            base = base.where(ImMessage.text.op("ILIKE")(any_(array(patterns))))

        count_q = select(func.count()).select_from(base.subquery())
        total = await self.session.scalar(count_q) or 0

        offset = (dto.page - 1) * dto.limit
        stmt = base.order_by(ImMessage.created_at.desc().nullslast()).offset(offset).limit(dto.limit)
        result = await self.session.scalars(stmt)
        return list(result.all()), total


