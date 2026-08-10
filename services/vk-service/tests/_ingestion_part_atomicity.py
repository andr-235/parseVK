from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from uuid import UUID

from sqlalchemy import func, select

from app.infrastructure.db.models.executions import VkExecution, VkExecutionAttempt
from app.infrastructure.db.models.ingestion_parts import (
    VkIngestionPartReference,
    VkIngestionStagingPart,
)
from app.infrastructure.db.models.ingestion_staging import VkIngestionStagingBatch
from app.infrastructure.db.repositories.ingestion_parts import (
    SqlAlchemyIngestionPartRepository,
)
from app.infrastructure.db.repositories.ingestion_staging import (
    SqlAlchemyIngestionStagingRepository,
)
from app.infrastructure.db.session import SessionLocal
from app.services.ingestion.part_preparation_service import (
    IngestionPartPreparationService,
)
from app.services.ingestion.prepared_stager import PreparedPhysicalIngestionStager
from app.services.ingestion.staging_writer import PhysicalIngestionStager


async def seed_claim(marker: int, prefix: str):
    execution_id = UUID(f"{marker}1111111-1111-1111-1111-111111111111")
    attempt_id = UUID(f"{marker}2222222-2222-2222-2222-222222222222")
    async with SessionLocal() as session:
        execution = VkExecution(
            id=execution_id,
            task_id=10,
            owner_user_id="owner",
            run_id=f"{prefix}-run-{marker}",
            status="running",
            plan_snapshot={"source": {"provider": "vk", "externalId": "42"}},
        )
        attempt = VkExecutionAttempt(
            id=attempt_id,
            execution_id=execution_id,
            attempt_number=1,
            fencing_token=7,
            worker_id="worker-1",
            status="running",
            provider_account_key="account-1",
            credential_version="v1",
            lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
            heartbeat_at=datetime.now(UTC),
        )
        session.add_all([execution, attempt])
        await session.commit()
    return SimpleNamespace(
        execution_id=execution_id,
        attempt_id=attempt_id,
        fencing_token=7,
    )


def prepared_stager(session, claim) -> PreparedPhysicalIngestionStager:
    physical = PhysicalIngestionStager.from_claim(
        SqlAlchemyIngestionStagingRepository(session), claim
    )
    return PreparedPhysicalIngestionStager(
        staging=physical,
        parts=IngestionPartPreparationService(
            SqlAlchemyIngestionPartRepository(session)
        ),
    )


async def manifest_counts(execution_id, source_kind: str) -> tuple[int, int, int]:
    async with SessionLocal() as session:
        staged = await session.scalar(
            select(func.count(VkIngestionStagingBatch.id)).where(
                VkIngestionStagingBatch.execution_id == execution_id,
                VkIngestionStagingBatch.source_kind == source_kind,
            )
        )
        parts = await session.scalar(
            select(func.count(VkIngestionStagingPart.id))
            .join(
                VkIngestionStagingBatch,
                VkIngestionStagingPart.batch_id == VkIngestionStagingBatch.id,
            )
            .where(VkIngestionStagingBatch.execution_id == execution_id)
        )
        references = await session.scalar(
            select(func.count(VkIngestionPartReference.part_id))
            .join(
                VkIngestionStagingPart,
                VkIngestionPartReference.part_id == VkIngestionStagingPart.id,
            )
            .join(
                VkIngestionStagingBatch,
                VkIngestionStagingPart.batch_id == VkIngestionStagingBatch.id,
            )
            .where(VkIngestionStagingBatch.execution_id == execution_id)
        )
    return int(staged or 0), int(parts or 0), int(references or 0)
