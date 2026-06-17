import logging

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.modules.listings.repository import ListingsRepository
from app.modules.listings.service import ListingsService

logger = logging.getLogger(__name__)


async def get_listings_service(session: AsyncSession = Depends(get_session)) -> ListingsService:
    logger.debug("[FIX] Instantiating ListingsService dependency")
    return ListingsService(ListingsRepository(session))
