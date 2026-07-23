import logging
from datetime import UTC, datetime

from app.modules.search.metrics import search_duration, search_rows_scanned
from app.modules.search.repository import SearchRepository
from app.modules.search.schemas import SearchMessagesRequest

logger = logging.getLogger(__name__)


class SearchService:
    def __init__(self, *, repository: SearchRepository):
        self.repository = repository

    async def search_messages(
        self,
        messenger: str | None,
        query: str | None,
        chat_id: str | None,
        author: str | None,
        page: int = 1,
        limit: int = 50,
    ) -> dict:
        logger.debug(
            "SearchService.search_messages: page=%d, limit=%d, filters=%s",
            page, limit, {"messenger": messenger, "query": query, "chat_id": chat_id, "author": author},
        )
        if not any([messenger, query, chat_id, author]):
            logger.warning("Empty query received — returning empty result set")
        started = datetime.now(UTC)
        rows, total = await self.repository.search_messages(messenger, query, chat_id, author, page, limit)
        items = [_message_to_dict(r) for r in rows]
        elapsed_ms = int((datetime.now(UTC) - started).total_seconds() * 1000)
        logger.info("Search completed: %d results in %dms", len(items), elapsed_ms)
        search_duration.labels(mode="simple").observe(elapsed_ms / 1000)
        return {"items": items, "total": total, "page": page, "limit": limit}

    async def search_messages_dto(self, dto: SearchMessagesRequest) -> dict:
        logger.debug(
            "SearchService.search_messages_dto: page=%d, limit=%d, filters=%s",
            dto.page, dto.limit, dto.model_dump(exclude_none=True),
        )
        started = datetime.now(UTC)
        rows, total = await self.repository.search_messages_dto(dto)
        items = [_message_to_dict(r) for r in rows]
        if dto.only_with_keywords and dto.keywords:
            for msg_dict in items:
                matched = _compute_matched_keywords(msg_dict.get("text") or "", dto.keywords)
                msg_dict["matched_keywords"] = matched
                logger.debug("Message %s: matched %d keywords", msg_dict.get("id"), len(matched))
        elapsed_ms = int((datetime.now(UTC) - started).total_seconds() * 1000)
        logger.info("Simple search completed: %d results in %dms", len(items), elapsed_ms)
        search_duration.labels(mode="simple").observe(elapsed_ms / 1000)
        return {"items": items, "total": total, "page": dto.page, "limit": dto.limit}

    async def search_messages_by_keywords(self, dto: SearchMessagesRequest) -> dict:
        logger.debug(
            "SearchService.search_messages_by_keywords: limit=%d, keywords_count=%d, keywords=%s",
            dto.limit,
            len(dto.keywords),
            dto.keywords,
        )
        started = datetime.now(UTC)
        rows, matched_kws, has_more, next_cursor, scanned = await self.repository.search_messages_by_keywords(dto)
        items = []
        for msg, kws in zip(rows, matched_kws, strict=False):
            d = _message_to_dict(msg)
            d["matched_keywords"] = kws
            items.append(d)
        elapsed_ms = int((datetime.now(UTC) - started).total_seconds() * 1000)
        logger.info("Keyword search completed: %d results, %d scanned in %dms", len(items), scanned, elapsed_ms)
        search_duration.labels(mode="keyword").observe(elapsed_ms / 1000)
        search_rows_scanned.labels(mode="keyword").observe(scanned)
        return {
            "items": items,
            "pageInfo": {"hasMore": has_more, "nextCursor": next_cursor},
            "scanned": scanned,
            "total": None,
            "totalMode": "not_calculated",
        }


def _compute_matched_keywords(text: str, keywords: list[str]) -> list[str]:
    if not text or not keywords:
        return []
    text_lower = text.lower()
    return [kw for kw in keywords if kw.lower() in text_lower]


def _message_to_dict(msg) -> dict:
    return {
        "id": msg.id,
        "messenger": msg.messenger,
        "external_id": msg.external_id,
        "chat_external_id": msg.chat_external_id,
        "chat_name": msg.chat_name,
        "author": msg.author,
        "text": msg.text,
        "content_url": msg.content_url,
        "content_type": msg.content_type,
        "created_at": msg.created_at,
        "ingested_at": msg.ingested_at,
        "message_key": f"{msg.messenger}:{msg.chat_external_id}:{msg.external_id}",
        "matched_keywords": [],
    }
