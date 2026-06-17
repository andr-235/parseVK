import logging

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.modules.content.author_repository import AuthorRepository
from app.modules.content.group_repository import GroupRepository
from app.modules.content.message_repository import MessageRepository
from app.modules.content.photo_analysis import PhotoAnalysisClient
from app.modules.content.service import ContentService

logger = logging.getLogger(__name__)


async def get_content_service(session: AsyncSession = Depends(get_session)) -> ContentService:
    logger.debug("[FIX] Instantiating ContentService dependency")
    return ContentService(
        group_repo=GroupRepository(session),
        post_repo=MessageRepository(session),
        author_repo=AuthorRepository(session),
        photo_analysis=PhotoAnalysisClient(),
    )
