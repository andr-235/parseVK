from collections.abc import AsyncGenerator

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.modules.search.repository import SearchRepository
from app.modules.search.service import SearchService


async def get_search_service(
    session: AsyncSession = Depends(get_session),
) -> AsyncGenerator[SearchService, None]:
    repository = SearchRepository(session)
    yield SearchService(repository=repository)
