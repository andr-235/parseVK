import logging

from app.db.models import Keyword
from app.modules.keywords.matcher import KeywordCandidate, build_keyword_candidates
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

logger = logging.getLogger(__name__)


class KeywordMatchRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def load_candidates(self, single_keyword_id: int | None = None) -> list[KeywordCandidate]:
        stmt = select(Keyword).options(selectinload(Keyword.keyword_forms))
        if single_keyword_id is not None:
            stmt = stmt.where(Keyword.id == single_keyword_id)
        result = await self.session.execute(stmt)
        keywords = result.scalars().all()
        logger.debug("Loaded keywords for matching: count=%d", len(keywords))
        return build_keyword_candidates(keywords)
