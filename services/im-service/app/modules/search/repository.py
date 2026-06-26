import logging
from datetime import datetime

from sqlalchemy import and_, any_, func, or_, select
from sqlalchemy.dialects.postgresql import array
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ImMessage
from app.modules.search.schemas import SearchMessagesRequest

logger = logging.getLogger(__name__)

MATCH_BATCH_SIZE = 5000


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

    async def search_messages_by_keywords(
        self,
        dto: SearchMessagesRequest,
    ) -> tuple[list[ImMessage], list[list[str]], bool, str | None]:
        conditions = []

        if dto.messenger:
            conditions.append(ImMessage.messenger == dto.messenger)
        if dto.chat_id:
            conditions.append(ImMessage.chat_external_id == dto.chat_id)
        if dto.date_from:
            conditions.append(ImMessage.created_at >= dto.date_from)
        if dto.date_to:
            conditions.append(ImMessage.created_at <= dto.date_to)

        base = select(ImMessage)
        if conditions:
            base = base.where(and_(*conditions))

        if dto.cursor:
            try:
                cursor_ts_str, cursor_id_str = dto.cursor.rsplit("_", 1)
                cursor_ts = datetime.fromisoformat(cursor_ts_str)
                cursor_id = int(cursor_id_str)
            except (ValueError, TypeError, AttributeError):
                pass
            else:
                base = base.where(
                    or_(
                        ImMessage.created_at < cursor_ts,
                        and_(ImMessage.created_at == cursor_ts, ImMessage.id < cursor_id),
                    )
                )

        stmt = base.order_by(ImMessage.created_at.desc().nullslast()).limit(MATCH_BATCH_SIZE)
        result = await self.session.scalars(stmt)
        rows = list(result.all())

        keywords = dto.keywords
        matched_messages: list[ImMessage] = []
        matched_keywords_list: list[list[str]] = []

        for msg in rows:
            text_lower = (msg.text or "").lower()
            found = [kw for kw in keywords if kw.lower() in text_lower]
            if found:
                matched_messages.append(msg)
                matched_keywords_list.append(found)

        has_more = len(matched_messages) > dto.limit
        page_msgs = matched_messages[: dto.limit]
        page_kws = matched_keywords_list[: dto.limit]

        next_cursor = None
        if has_more and page_msgs:
            last_msg = page_msgs[-1]
            if last_msg.created_at:
                next_cursor = f"{last_msg.created_at.isoformat()}_{last_msg.id}"

        return page_msgs, page_kws, has_more, next_cursor
