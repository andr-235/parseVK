import logging
from dataclasses import dataclass

from app.modules.keywords.repository import KeywordsRepository

logger = logging.getLogger(__name__)


@dataclass
class KeywordResult:
    added: int = 0
    deleted: int = 0


class KeywordsService:
    def __init__(self, *, repository: KeywordsRepository):
        self.repository = repository

    async def add_keyword(self, user_id: str, messenger: str, keyword: str) -> dict | None:
        row = await self.repository.add(user_id, messenger, keyword.strip().lower())
        if row is None:
            return None
        return {"id": row.id, "messenger": row.messenger, "keyword": row.keyword, "created_at": row.created_at}

    async def list_keywords(self, user_id: str, messenger: str | None = None) -> list[dict]:
        rows = await self.repository.list_by_user(user_id, messenger)
        return [
            {"id": r.id, "messenger": r.messenger, "keyword": r.keyword, "created_at": r.created_at}
            for r in rows
        ]

    async def delete_keyword(self, keyword_id: int, user_id: str) -> bool:
        return await self.repository.delete(keyword_id, user_id)
