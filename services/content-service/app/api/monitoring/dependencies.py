from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.bootstrap import ContentContainer
from app.infrastructure.db.session import get_session
from app.services.monitoring.groups import MonitoringGroupService
from app.services.monitoring.messages import MonitoringMessageService

SessionDep = Annotated[AsyncSession, Depends(get_session)]


def get_container(request: Request) -> ContentContainer:
    return request.app.state.container


def get_monitoring_groups(
    session: SessionDep,
    container: Annotated[ContentContainer, Depends(get_container)],
) -> MonitoringGroupService:
    return container.monitoring_groups(session)


def get_monitoring_messages(
    session: SessionDep,
    container: Annotated[ContentContainer, Depends(get_container)],
) -> MonitoringMessageService:
    return container.monitoring_messages(session)
