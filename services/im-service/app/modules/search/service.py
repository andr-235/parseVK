import logging

from app.modules.search.repository import SearchRepository

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

    async def search_by_keywords(
        self,
        user_id: str,
        messenger: str | None,
        page: int = 1,
        limit: int = 50,
    ) -> dict:
        rows, total = await self.repository.search_by_keywords(user_id, messenger, page, limit)
        items = [_message_to_dict(r) for r in rows]
        logger.info(
            "Search by keywords: user_id=%s messenger=%s total=%d page=%d",
            user_id, messenger, total, page,
        )
        return {"items": items, "total": total, "page": page, "limit": limit}


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
    }
