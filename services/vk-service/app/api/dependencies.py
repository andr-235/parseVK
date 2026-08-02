from uuid import uuid4

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

import app.bootstrap as bootstrap
from app.core.redaction import redact_secrets
from app.domain.exceptions.provider_account import ProviderAccountBlockedError
from app.domain.ports.vk_api import VkApiPort
from app.domain.repositories.ok_friends import OkFriendsRepository
from app.domain.repositories.vk_friends import VkFriendsRepository
from app.infrastructure.db.session import get_session
from app.infrastructure.vk_client.transport import VkApiConfigurationError
from app.services.ingestion_service import IngestionService
from app.services.ok_friends.exporter import OkFriendsExportService
from app.services.vk_friends.exporter import VkFriendsExportService
from app.services.vk_groups_service import VkGroupsService
from app.tasks.vk_client_binding import bind_system_vk_client


async def get_vk_client_dep(
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> VkApiPort:
    lane_id = request.headers.get("X-Correlation-ID") or f"http:{uuid4()}"
    try:
        return await bind_system_vk_client(
            bootstrap.get_vk_client(),
            bootstrap.get_provider_account_repository,
            session,
            lane_id,
        )
    except (ProviderAccountBlockedError, VkApiConfigurationError) as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=redact_secrets(str(error)),
        ) from error


async def get_vk_friends_service_dep(
    session: AsyncSession = Depends(get_session),
    client: VkApiPort = Depends(get_vk_client_dep),
) -> VkFriendsExportService:
    return bootstrap.get_vk_friends_service(session, adapter=client)


async def get_ok_friends_service_dep(
    session: AsyncSession = Depends(get_session),
) -> OkFriendsExportService:
    return bootstrap.get_ok_friends_service(session)


async def get_ingestion_service_dep(
    session: AsyncSession = Depends(get_session),
    client: VkApiPort = Depends(get_vk_client_dep),
) -> IngestionService:
    return bootstrap.get_ingestion_service(session, adapter=client)


async def get_vk_groups_service_dep(
    session: AsyncSession = Depends(get_session),
) -> VkGroupsService:
    return bootstrap.get_vk_groups_service(session)


async def get_ok_friends_repository_dep(
    session: AsyncSession = Depends(get_session),
) -> OkFriendsRepository:
    from app.infrastructure.db.repositories.ok_friends import (
        SqlAlchemyOkFriendsRepository,
    )

    return SqlAlchemyOkFriendsRepository(session)


async def get_vk_friends_repository_dep(
    session: AsyncSession = Depends(get_session),
) -> VkFriendsRepository:
    from app.infrastructure.db.repositories.vk_friends import (
        SqlAlchemyVkFriendsRepository,
    )

    return SqlAlchemyVkFriendsRepository(session)
