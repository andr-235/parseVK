from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.infrastructure.db.session import get_session
import app.bootstrap as bootstrap
from app.services.vk_friends_service import VkFriendsExportService
from app.services.ok_friends_service import OkFriendsExportService
from app.services.ingestion_service import IngestionService
from app.services.vk_api_service import VkApiService

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

async def get_vk_api_service_dep(
    session: AsyncSession = Depends(get_session)
) -> VkApiService:
    return bootstrap.get_vk_api_service(session)

