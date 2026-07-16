from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.domain.ports.vk_api import VkApiPort
from app.infrastructure.db.repositories.ingestion import SqlAlchemyIngestionRepository
from app.infrastructure.db.repositories.ok_friends import SqlAlchemyOkFriendsRepository
from app.infrastructure.db.repositories.outbox import SqlAlchemyOutboxRepository
from app.infrastructure.db.repositories.tasks import SqlAlchemyTaskEventsRepository
from app.infrastructure.db.repositories.vk_friends import SqlAlchemyVkFriendsRepository
from app.infrastructure.ok_client.client import OkApiClient
from app.infrastructure.tasks_client.client import TasksClient
from app.infrastructure.vk_client.client import VkApiClient
from app.services.domain_events_service import OutboxService
from app.services.ingestion.collector import DataCollector
from app.services.ingestion.pipeline import IngestionPipeline
from app.services.ingestion_service import IngestionService
from app.services.ok_friends.exporter import OkFriendsExportService
from app.services.task_events_service import TaskEventsService
from app.services.vk_friends.exporter import VkFriendsExportService
from app.services.vk_groups_service import VkGroupsService

# Shared Client Singletons (VkApiClient & OkApiClient are stateless/managed cleanly)
_vk_client = VkApiClient()


def get_vk_client() -> VkApiPort:
    return _vk_client


_ok_client = OkApiClient()
_tasks_client = TasksClient()


def get_tasks_client() -> TasksClient:
    return _tasks_client


def get_vk_friends_service(session: AsyncSession) -> VkFriendsExportService:
    repo = SqlAlchemyVkFriendsRepository(session)
    return VkFriendsExportService(repo=repo, vk_client=_vk_client)


def get_ok_friends_service(session: AsyncSession) -> OkFriendsExportService:
    repo = SqlAlchemyOkFriendsRepository(session)
    return OkFriendsExportService(repo=repo, ok_client=_ok_client)


def get_ingestion_service(session: AsyncSession) -> IngestionService:
    repository = SqlAlchemyIngestionRepository(session)
    outbox_repo = SqlAlchemyOutboxRepository(session)
    outbox_service = OutboxService(outbox_repo)

    def sanitize_error(error: str) -> str:
        token = getattr(_vk_client, "token", None) or settings.vk_token
        if token and token in error:
            return error.replace(token, "<redacted>")
        return error

    collector = DataCollector(
        adapter=_vk_client,
        repository=repository,
        tasks_client=_tasks_client,
        outbox=outbox_service,
        on_error=sanitize_error,
        checkpoint=session.commit,
    )
    pipeline = IngestionPipeline(
        collector=collector,
        tasks_client=_tasks_client,
        outbox=outbox_service,
        on_error=sanitize_error,
    )
    return IngestionService(
        adapter=_vk_client,
        repository=repository,
        tasks_client=_tasks_client,
        collector=collector,
        pipeline=pipeline,
        outbox_service=outbox_service,
    )


def get_task_events_handler(session: AsyncSession) -> TaskEventsService:
    repository = SqlAlchemyTaskEventsRepository(session)
    return TaskEventsService(repository=repository)


def get_vk_groups_service(session: AsyncSession) -> VkGroupsService:
    ingestion_repo = SqlAlchemyIngestionRepository(session)
    outbox_repo = SqlAlchemyOutboxRepository(session)
    outbox_service = OutboxService(outbox_repo)
    return VkGroupsService(
        ingestion_repo=ingestion_repo,
        outbox_service=outbox_service,
    )
