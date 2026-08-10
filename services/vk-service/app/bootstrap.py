from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.domain.ports.secret_provider import SecretProvider
from app.domain.ports.vk_api import VkApiPort
from app.domain.repositories.provider_accounts import ProviderAccountRepository
from app.infrastructure.db.repositories.ingestion import SqlAlchemyIngestionRepository
from app.infrastructure.db.repositories.ok_friends import SqlAlchemyOkFriendsRepository
from app.infrastructure.db.repositories.outbox import SqlAlchemyOutboxRepository
from app.infrastructure.db.repositories.provider_accounts import (
    SqlAlchemyProviderAccountRepository,
)
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
from app.services.ingestion.factory import build_ingestion_service
from app.services.ok_friends.exporter import OkFriendsExportService
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
    account_id,
    code,
)
_vk_client = VkApiClient(
    secret_provider=_secret_provider,
    scheduler=_vk_scheduler,
    transport=_vk_transport,
)
_ok_client = OkApiClient()
_tasks_client = TasksClient()


def get_vk_client() -> VkApiPort:
    return _vk_client


def get_secret_provider() -> SecretProvider:
    return _secret_provider


def get_provider_account_repository(
    session: AsyncSession,
) -> ProviderAccountRepository:
    return SqlAlchemyProviderAccountRepository(session)


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
    attempt_control=None,
):
    return build_ingestion_service(
        session,
        adapter=adapter or _vk_client,
        tasks_client=_tasks_client,
        attempt_control=attempt_control,
    )


def get_vk_groups_service(session: AsyncSession) -> VkGroupsService:
    ingestion_repo = SqlAlchemyIngestionRepository(session)
    outbox_service = OutboxService(SqlAlchemyOutboxRepository(session))
    return VkGroupsService(
        ingestion_repo=ingestion_repo,
        outbox_service=outbox_service,
    )
