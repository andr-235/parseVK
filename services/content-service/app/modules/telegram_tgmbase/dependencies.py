import logging

from app.db.session import get_tgmbase_session
from app.modules.telegram_tgmbase.service import TelegramTgmbaseService
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


async def get_tgmbase_service(
    session: AsyncSession = Depends(get_tgmbase_session)
) -> TelegramTgmbaseService:
    logger.debug("[FIX] Instantiating TelegramTgmbaseService dependency")
    return TelegramTgmbaseService(session)
