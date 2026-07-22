import logging
from datetime import datetime

from sqlalchemy import and_, any_, func, or_, select
from sqlalchemy.dialects.postgresql import array
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ImMessage
from app.modules.search.schemas import SearchMessagesRequest

logger = logging.getLogger(__name__)

MATCH_BATCH_SIZE = 5000
MATCH_MAX_SCAN = 25000


def _parse_cursor(cursor: str) -> tuple[datetime, int] | None:
    try:
        ts_str, id_str = cursor.rsplit("_", 1)
        return datetime.fromisoformat(ts_str), int(id_str)
    except (ValueError, TypeError, AttributeError):
        logger.warning("Keyset cursor parse error: %s", cursor)
        return None


def _build_cursor(msg: ImMessage) -> str | None:
    if msg.created_at is None:
        return None
    return f"{msg.created_at.isoformat()}_{msg.id}"


def _order_by():
    return ImMessage.created_at.desc().nullslast(), ImMessage.id.desc()


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

        logger.debug("SearchRepository.search_messages: filters=%s", conditions)
        base = select(ImMessage)
        if conditions:
            base = base.where(and_(*conditions))

        count_q = select(func.count()).select_from(base.subquery())
        total = await self.session.scalar(count_q) or 0

        offset = (page - 1) * limit
        stmt = base.order_by(*_order_by()).offset(offset).limit(limit)
        result = await self.session.scalars(stmt)
        rows = list(result.all())
        logger.debug("Search returned %d rows, total=%d", len(rows), total)
        return rows, total

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
        stmt = base.order_by(*_order_by()).offset(offset).limit(dto.limit)
        result = await self.session.scalars(stmt)
        rows = list(result.all())
        logger.debug("Search returned %d rows, total=%d", len(rows), total)
        return rows, total

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

        limit = dto.limit
        keywords = dto.keywords
        matched: list[ImMessage] = []
        matched_kws: list[list[str]] = []
        total_scanned = 0
        scan_cursor: str | None = dto.cursor

        while len(matched) <= limit and total_scanned < MATCH_MAX_SCAN:
            q = base
            if scan_cursor:
                parsed = _parse_cursor(scan_cursor)
                if parsed:
                    cursor_ts, cursor_id = parsed
                    q = q.where(
                        or_(
                            ImMessage.created_at < cursor_ts,
                            and_(ImMessage.created_at == cursor_ts, ImMessage.id < cursor_id),
                        )
                    )

            stmt = q.order_by(*_order_by()).limit(MATCH_BATCH_SIZE)
            result = await self.session.scalars(stmt)
            batch = list(result.all())
            if not batch:
                break

            for msg in batch:
                text_lower = (msg.text or "").lower()
                found = [kw for kw in keywords if kw.lower() in text_lower]
                if found:
                    matched.append(msg)
                    matched_kws.append(found)

            total_scanned += len(batch)
            last_msg = batch[-1]
            scan_cursor = _build_cursor(last_msg)
            logger.debug("Keyset cursor batch: scanned=%d, matched=%d, cursor=%s", len(batch), len(matched), scan_cursor)

            if len(batch) < MATCH_BATCH_SIZE:
                break

        has_more = len(matched) > limit
        page_msgs = matched[:limit]
        page_kws = matched_kws[:limit]

        next_cursor = None
        if has_more and page_msgs:
            next_cursor = _build_cursor(page_msgs[-1])
        elif total_scanned > 0 and total_scanned >= MATCH_MAX_SCAN and scan_cursor:
            next_cursor = scan_cursor
            has_more = True

        return page_msgs, page_kws, has_more, next_cursor
