"""FastAPI dependency injection hooks for tasks-service.

Routes service creation through ApplicationFactory to ensure
consistent DI wiring across all routers.
"""

import logging

from app.bootstrap import ApplicationFactory
from app.db.session import get_session
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


async def get_tasks_service(session: AsyncSession = Depends(get_session)):
    logger.debug("Creating tasks service via DI")
    factory = ApplicationFactory(session)
    return factory.create_tasks_service()


async def get_automation_service(session: AsyncSession = Depends(get_session)):
    logger.debug("Creating automation service via DI")
    factory = ApplicationFactory(session)
    return factory.create_automation_service()
