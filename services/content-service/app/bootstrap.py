import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.infrastructure.clients.moderation import ModerationPhotoSummaryClient
from app.infrastructure.clients.vk import VkProfilesHttpClient
from app.infrastructure.db.repositories.authors import AuthorRepository
from app.infrastructure.db.repositories.groups import GroupRepository
from app.infrastructure.db.repositories.monitoring import (
    MonitoringGroupRepository,
    MonitoringMessageRepository,
)
from app.infrastructure.db.repositories.posts import MessageRepository
from app.services.content.author_commands import AuthorCommandService
from app.services.content.authors import AuthorQueryService
from app.services.content.groups import GroupService
from app.services.content.posts import PostService
from app.services.monitoring.groups import MonitoringGroupService
from app.services.monitoring.messages import MonitoringMessageService


class ContentContainer:
    def __init__(self):
        timeout = httpx.Timeout(settings.photo_analysis_timeout_seconds)
        self.vk_http = httpx.AsyncClient(
            base_url=settings.vk_service_base_url.rstrip("/"),
            timeout=10.0,
        )
        self.photo_http = (
            httpx.AsyncClient(
                base_url=settings.photo_analysis_base_url.rstrip("/"),
                timeout=timeout,
            )
            if settings.photo_analysis_base_url
            else None
        )

    def author_query(self, session: AsyncSession) -> AuthorQueryService:
        summaries = None
        if self.photo_http:
            summaries = ModerationPhotoSummaryClient(
                self.photo_http,
                internal_token=settings.internal_service_token,
                enrichment_budget_seconds=settings.photo_analysis_enrichment_budget_seconds,
                max_concurrency=settings.photo_analysis_max_concurrency,
            )
        return AuthorQueryService(AuthorRepository(session), summaries)

    def author_commands(self, session: AsyncSession) -> AuthorCommandService:
        profiles = VkProfilesHttpClient(
            self.vk_http,
            internal_token=settings.internal_service_token,
        )
        return AuthorCommandService(AuthorRepository(session), profiles)

    @staticmethod
    def groups(session: AsyncSession) -> GroupService:
        return GroupService(GroupRepository(session))

    @staticmethod
    def posts(session: AsyncSession) -> PostService:
        return PostService(MessageRepository(session))

    @staticmethod
    def monitoring_groups(session: AsyncSession) -> MonitoringGroupService:
        return MonitoringGroupService(
            MonitoringGroupRepository(session),
            MonitoringMessageRepository(session),
        )

    @staticmethod
    def monitoring_messages(session: AsyncSession) -> MonitoringMessageService:
        return MonitoringMessageService(MonitoringMessageRepository(session))

    async def close(self) -> None:
        await self.vk_http.aclose()
        if self.photo_http:
            await self.photo_http.aclose()
