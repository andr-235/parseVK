from collections.abc import AsyncGenerator

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.modules.notifier.repository import NotifierRepository
from app.modules.notifier.service import NotifierService


async def get_notifier_service(
    session: AsyncSession = Depends(get_session),
) -> AsyncGenerator[NotifierService, None]:
    repository = NotifierRepository(session)
    yield NotifierService(repository=repository)
