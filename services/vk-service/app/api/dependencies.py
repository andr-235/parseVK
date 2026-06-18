from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

import app.bootstrap as bootstrap
from app.infrastructure.db.session import get_session
from app.services.ingestion_service import IngestionService
from app.services.ok_friends_service import OkFriendsExportService
from app.services.vk_friends_service import VkFriendsExportService
from app.services.vk_groups_service import VkGroupsService


async def get_vk_friends_service_dep(
    session: AsyncSession = Depends(get_session)
) -> VkFriendsExportService:
    return bootstrap.get_vk_friends_service(session)

async def get_ok_friends_service_dep(
    session: AsyncSession = Depends(get_session)
) -> OkFriendsExportService:
    return bootstrap.get_ok_friends_service(session)

async def get_ingestion_service_dep(
    session: AsyncSession = Depends(get_session)
) -> IngestionService:
    return bootstrap.get_ingestion_service(session)

async def get_vk_groups_service_dep(
    session: AsyncSession = Depends(get_session)
) -> VkGroupsService:
    return bootstrap.get_vk_groups_service(session)


from app.domain.repositories.ok_friends import OkFriendsRepository


async def get_ok_friends_repository_dep(
    session: AsyncSession = Depends(get_session)
) -> OkFriendsRepository:
    from app.infrastructure.db.repositories.ok_friends import SqlAlchemyOkFriendsRepository
    return SqlAlchemyOkFriendsRepository(session)


