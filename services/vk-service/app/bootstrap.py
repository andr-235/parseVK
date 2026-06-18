from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.repositories.ingestion import SqlAlchemyIngestionRepository
from app.infrastructure.db.repositories.ok_friends import SqlAlchemyOkFriendsRepository
from app.infrastructure.db.repositories.outbox import SqlAlchemyOutboxRepository
from app.infrastructure.db.repositories.tasks import SqlAlchemyTaskEventsRepository

# Repositories
from app.infrastructure.db.repositories.vk_friends import SqlAlchemyVkFriendsRepository
from app.infrastructure.ok_client.client import OkApiClient
from app.infrastructure.tasks_client.client import TasksClient

# Clients
from app.infrastructure.vk_client.client import VkApiClient
from app.services.domain_events_service import OutboxService
from app.services.ingestion_service import IngestionService
from app.services.ok_friends_service import OkFriendsExportService
from app.services.task_events_service import TaskEventsService

# Services
from app.services.vk_friends_service import VkFriendsExportService
from app.services.vk_groups_service import VkGroupsService

# Shared Client Singletons (VkApiClient & OkApiClient are stateless/managed cleanly)
_vk_client = VkApiClient()
_ok_client = OkApiClient()
_tasks_client = TasksClient()

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
    return IngestionService(
        adapter=_vk_client,
        repository=repository,
        tasks_client=_tasks_client,
        outbox_service=outbox_service,
    )

def get_task_events_handler(session: AsyncSession) -> TaskEventsService:
    repository = SqlAlchemyTaskEventsRepository(session)
    return TaskEventsService(
        repository=repository,
        tasks_client=_tasks_client,
    )

def get_vk_groups_service(session: AsyncSession) -> VkGroupsService:
    ingestion_repo = SqlAlchemyIngestionRepository(session)
    outbox_repo = SqlAlchemyOutboxRepository(session)
    outbox_service = OutboxService(outbox_repo)
    return VkGroupsService(
        session=session,
        ingestion_repo=ingestion_repo,
        outbox_service=outbox_service,
    )

