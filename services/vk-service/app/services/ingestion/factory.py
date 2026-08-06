from sqlalchemy.ext.asyncio import AsyncSession

from app.core.redaction import redact_secrets
from app.domain.ports.vk_api import VkApiPort
from app.infrastructure.db.repositories.checkpoint import (
    SqlAlchemyIngestionCheckpointStore,
)
from app.infrastructure.db.repositories.ingestion import SqlAlchemyIngestionRepository
from app.infrastructure.db.repositories.ingestion_staging import (
    SqlAlchemyIngestionStagingRepository,
)
from app.infrastructure.db.repositories.outbox import SqlAlchemyOutboxRepository
from app.infrastructure.tasks_client.client import TasksClient
from app.services.demand_fanout import DemandLifecycleFanout
from app.services.domain_events_service import OutboxService
from app.services.ingestion.collector import DataCollector
from app.services.ingestion.pipeline import IngestionPipeline
from app.services.ingestion.staging_writer import PhysicalIngestionStager
from app.services.ingestion_service import IngestionService


def build_ingestion_service(
    session: AsyncSession,
    *,
    adapter: VkApiPort,
    tasks_client: TasksClient,
    attempt_control=None,
) -> IngestionService:
    repository = SqlAlchemyIngestionRepository(session)
    outbox = OutboxService(SqlAlchemyOutboxRepository(session), session=session)
    checkpoints = SqlAlchemyIngestionCheckpointStore(session)
    demand_fanout = DemandLifecycleFanout(session=session)
    staging = None
    if attempt_control is not None:
        staging = PhysicalIngestionStager.from_claim(
            SqlAlchemyIngestionStagingRepository(session),
            attempt_control.claim,
        )

    async def commit_page() -> None:
        if attempt_control is not None:
            await attempt_control.ensure_active_in_session(session)
        await session.commit()

    collector = DataCollector(
        adapter=adapter,
        repository=repository,
        tasks_client=tasks_client,
        outbox=outbox,
        staging=staging,
        require_staging=True,
        on_error=redact_secrets,
        page_committer=commit_page,
        checkpoint_store=checkpoints,
        demand_fanout=demand_fanout,
    )
    pipeline = IngestionPipeline(
        collector=collector,
        tasks_client=tasks_client,
        outbox=outbox,
        on_error=redact_secrets,
        demand_fanout=demand_fanout,
    )
    return IngestionService(
        adapter=adapter,
        repository=repository,
        tasks_client=tasks_client,
        collector=collector,
        pipeline=pipeline,
        outbox_service=outbox,
    )
