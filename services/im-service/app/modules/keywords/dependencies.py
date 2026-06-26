from collections.abc import AsyncGenerator

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.modules.keywords.repository import KeywordsRepository
from app.modules.keywords.service import KeywordsService


async def get_keywords_service(
    session: AsyncSession = Depends(get_session),
) -> AsyncGenerator[KeywordsService, None]:
    repository = KeywordsRepository(session)
    yield KeywordsService(repository=repository)
