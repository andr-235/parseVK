import logging
from typing import Annotated

from app.db.session import get_session
from app.modules.monitoring.service import MonitoringService
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


async def get_monitoring_service(
    session: Annotated[AsyncSession, Depends(get_session)]
) -> MonitoringService:
    logger.debug("[FIX] Instantiating MonitoringService dependency")
    return MonitoringService(session)
