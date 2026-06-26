import logging

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
        rows, total = await self.repository.search_messages(messenger, query, chat_id, author, page, limit)
        items = [_message_to_dict(r) for r in rows]
        logger.info(
            "Search messages: messenger=%s query=%s total=%d page=%d",
            messenger, query, total, page,
        )
        return {"items": items, "total": total, "page": page, "limit": limit}

    async def search_messages_dto(self, dto: SearchMessagesRequest) -> dict:
        rows, total = await self.repository.search_messages_dto(dto)
        items = [_message_to_dict(r) for r in rows]
        if dto.only_with_keywords and dto.keywords:
            for msg_dict, row in zip(items, rows, strict=False):
                matched = _compute_matched_keywords(msg_dict.get("text") or "", dto.keywords)
                msg_dict["matched_keywords"] = matched
        logger.info(
            "Search messages DTO: messenger=%s query=%s total=%d page=%d keywords=%d",
            dto.messenger, dto.query, total, dto.page, len(dto.keywords),
        )
        return {"items": items, "total": total, "page": dto.page, "limit": dto.limit}

    async def search_messages_by_keywords(self, dto: SearchMessagesRequest) -> dict:
        rows, matched_kws, has_more, next_cursor = await self.repository.search_messages_by_keywords(dto)
        items = []
        for msg, kws in zip(rows, matched_kws, strict=False):
            d = _message_to_dict(msg)
            d["matched_keywords"] = kws
            items.append(d)
        logger.info(
            "Search messages by keywords: messenger=%s keywords=%d has_more=%s",
            dto.messenger, len(dto.keywords), has_more,
        )
        return {
            "items": items,
            "pageInfo": {"hasMore": has_more, "nextCursor": next_cursor},
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
        "matched_keywords": [],
    }
