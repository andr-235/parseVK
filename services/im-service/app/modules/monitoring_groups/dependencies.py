from collections.abc import AsyncGenerator

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.modules.monitoring_groups.repository import MonitoringGroupsRepository
from app.modules.monitoring_groups.service import MonitoringGroupsService


async def get_monitoring_groups_service(
    session: AsyncSession = Depends(get_session),
) -> AsyncGenerator[MonitoringGroupsService, None]:
    repository = MonitoringGroupsRepository(session)
    yield MonitoringGroupsService(repository=repository)
