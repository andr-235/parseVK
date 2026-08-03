from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.redaction import redact_secrets
from app.domain.ports.secret_provider import SecretProvider
from app.domain.ports.vk_api import VkApiPort
from app.domain.repositories.provider_accounts import ProviderAccountRepository
from app.infrastructure.db.repositories.checkpoint import (
    SqlAlchemyIngestionCheckpointStore,
)
from app.infrastructure.db.repositories.ingestion import SqlAlchemyIngestionRepository
from app.infrastructure.db.repositories.ok_friends import SqlAlchemyOkFriendsRepository
from app.infrastructure.db.repositories.outbox import SqlAlchemyOutboxRepository
from app.infrastructure.db.repositories.provider_accounts import (
    SqlAlchemyProviderAccountRepository,
)
from app.infrastructure.db.repositories.tasks import SqlAlchemyTaskEventsRepository
from app.infrastructure.db.repositories.vk_friends import SqlAlchemyVkFriendsRepository
from app.infrastructure.metrics.vk_metrics import (
    observe_rate_limit_retry,
    observe_request,
    observe_scheduler_wait,
    set_scheduler_queue_depth,
)
from app.infrastructure.ok_client.client import OkApiClient
from app.infrastructure.secrets import build_secret_provider
from app.infrastructure.tasks_client.client import TasksClient
from app.infrastructure.vk_client.client import VkApiClient
from app.infrastructure.vk_client.transport import VkTransport
from app.services.domain_events_service import OutboxService
from app.services.ingestion.collector import DataCollector
from app.services.ingestion.pipeline import IngestionPipeline
from app.services.ingestion_service import IngestionService
from app.services.ok_friends.exporter import OkFriendsExportService
from app.services.task_events_service import TaskEventsService
from app.services.vk_friends.exporter import VkFriendsExportService
from app.services.vk_groups_service import VkGroupsService
from app.services.vk_retry_policy import VkRetryPolicy
from app.services.vk_scheduler import FairScheduler

_secret_provider = build_secret_provider(settings)
_vk_transport = VkTransport()
_vk_scheduler = FairScheduler(VkRetryPolicy(settings))


def _on_scheduler_result(
    account_id: str,
    method: str,
    outcome: str,
    wait_seconds: float,
    duration: float,
) -> None:
    observe_request(account_id, method, outcome, duration)
    observe_scheduler_wait(account_id, wait_seconds)
    set_scheduler_queue_depth(account_id, _vk_scheduler.queue_depth(account_id))


_vk_scheduler.metrics_hook = _on_scheduler_result
_vk_scheduler.retry_hook = lambda account_id, code: observe_rate_limit_retry(
    account_id, code
)
_vk_client = VkApiClient(
    secret_provider=_secret_provider,
    scheduler=_vk_scheduler,
    transport=_vk_transport,
)


def get_vk_client() -> VkApiPort:
    return _vk_client


def get_secret_provider() -> SecretProvider:
    return _secret_provider


def get_provider_account_repository(
    session: AsyncSession,
) -> ProviderAccountRepository:
    return SqlAlchemyProviderAccountRepository(session)


_ok_client = OkApiClient()
_tasks_client = TasksClient()


def get_tasks_client() -> TasksClient:
    return _tasks_client


def get_vk_friends_service(
    session: AsyncSession,
    *,
    adapter: VkApiPort | None = None,
) -> VkFriendsExportService:
    repo = SqlAlchemyVkFriendsRepository(session)
    return VkFriendsExportService(repo=repo, vk_client=adapter or _vk_client)


def get_ok_friends_service(session: AsyncSession) -> OkFriendsExportService:
    repo = SqlAlchemyOkFriendsRepository(session)
    return OkFriendsExportService(repo=repo, ok_client=_ok_client)


def get_ingestion_service(
    session: AsyncSession,
    *,
    adapter: VkApiPort | None = None,
) -> IngestionService:
    adapter = adapter or _vk_client
    repository = SqlAlchemyIngestionRepository(session)
    outbox_repo = SqlAlchemyOutboxRepository(session)
    outbox_service = OutboxService(outbox_repo, session=session)
    checkpoint_store = SqlAlchemyIngestionCheckpointStore(session)

    collector = DataCollector(
        adapter=adapter,
        repository=repository,
        tasks_client=_tasks_client,
        outbox=outbox_service,
        on_error=redact_secrets,
        page_committer=session.commit,
        checkpoint_store=checkpoint_store,
    )
    pipeline = IngestionPipeline(
        collector=collector,
        tasks_client=_tasks_client,
        outbox=outbox_service,
        on_error=redact_secrets,
    )
    return IngestionService(
        adapter=adapter,
        repository=repository,
        tasks_client=_tasks_client,
        collector=collector,
        pipeline=pipeline,
        outbox_service=outbox_service,
    )


def get_task_events_handler(session: AsyncSession) -> TaskEventsService:
    repository = SqlAlchemyTaskEventsRepository(session)
    return TaskEventsService(repository=repository, tasks_client=_tasks_client)


def get_vk_groups_service(session: AsyncSession) -> VkGroupsService:
    ingestion_repo = SqlAlchemyIngestionRepository(session)
    outbox_repo = SqlAlchemyOutboxRepository(session)
    outbox_service = OutboxService(outbox_repo)
    return VkGroupsService(
        ingestion_repo=ingestion_repo,
        outbox_service=outbox_service,
    )
