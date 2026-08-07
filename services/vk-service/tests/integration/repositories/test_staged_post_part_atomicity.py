from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from uuid import UUID

import pytest
from sqlalchemy import func, select

from app.infrastructure.db.models.executions import VkExecution, VkExecutionAttempt
from app.infrastructure.db.models.ingestion_parts import (
    VkIngestionPartReference,
    VkIngestionStagingPart,
)
from app.infrastructure.db.models.ingestion_staging import VkIngestionStagingBatch
from app.infrastructure.db.models.vk_ingestion import VkAuthor, VkPost
from app.infrastructure.db.repositories.ingestion import SqlAlchemyIngestionRepository
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
from app.services.ingestion.post_collector import PostCollector
from app.services.ingestion.prepared_stager import PreparedPhysicalIngestionStager
from app.services.ingestion.staging_writer import PhysicalIngestionStager

pytestmark = pytest.mark.anyio


async def seed_claim(marker: int):
    execution_id = UUID(f"{marker}1111111-1111-1111-1111-111111111111")
    attempt_id = UUID(f"{marker}2222222-2222-2222-2222-222222222222")
    async with SessionLocal() as session:
        execution = VkExecution(
            id=execution_id,
            task_id=10,
            owner_user_id="owner",
            run_id=f"staged-post-run-{marker}",
            status="running",
            plan_snapshot={"source": {"provider": "vk", "externalId": "42"}},
        )
        attempt = VkExecutionAttempt(
            id=attempt_id,
            execution_id=execution.id,
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


async def persisted_state(execution_id, owner_id, post_id):
    async with SessionLocal() as session:
        staged = await session.scalar(
            select(func.count(VkIngestionStagingBatch.id)).where(
                VkIngestionStagingBatch.execution_id == execution_id,
                VkIngestionStagingBatch.source_kind == "post_snapshot",
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
        posts = await session.scalar(
            select(func.count(VkPost.id)).where(
                VkPost.vk_owner_id == owner_id,
                VkPost.vk_post_id == post_id,
            )
        )
        authors = await session.scalar(
            select(func.count(VkAuthor.id)).where(VkAuthor.vk_author_id == owner_id)
        )
    return staged, parts, references, posts, authors


async def run_post(marker: int, *, reject: bool):
    claim = await seed_claim(marker)
    owner_id, post_id = -60 - marker, 100 + marker
    post = {
        "owner_id": owner_id,
        "id": post_id,
        "from_id": owner_id,
        "text": "zero-comment post",
        "date": 1_700_000_000,
    }
    profiles = {owner_id: {"id": abs(owner_id), "name": "Group"}}
    async with SessionLocal() as session:
        physical = PhysicalIngestionStager.from_claim(
            SqlAlchemyIngestionStagingRepository(session), claim
        )
        staging = PreparedPhysicalIngestionStager(
            staging=physical,
            parts=IngestionPartPreparationService(
                SqlAlchemyIngestionPartRepository(session)
            ),
        )
        collector = PostCollector(
            adapter=object(),
            repository=SqlAlchemyIngestionRepository(session),
            staging=staging,
            require_staging=True,
        )
        await collector.save_post(
            post,
            SimpleNamespace(task_id=10),
            profiles,
        )
        if reject:
            await session.rollback()
        else:
            await session.commit()
    return await persisted_state(claim.execution_id, owner_id, post_id)


async def test_zero_comment_post_part_and_local_effects_commit_atomically():
    staged, parts, references, posts, authors = await run_post(6, reject=False)

    assert staged == 1
    assert parts == 1
    assert references == 1
    assert posts == 1
    assert authors == 1


async def test_post_transaction_rollback_removes_preparation_and_local_effects():
    staged, parts, references, posts, authors = await run_post(7, reject=True)

    assert staged == 0
    assert parts == 0
    assert references == 0
    assert posts == 0
    assert authors == 0
