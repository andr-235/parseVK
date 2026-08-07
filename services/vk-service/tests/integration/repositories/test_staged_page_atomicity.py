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
from app.infrastructure.db.repositories.checkpoint import (
    SqlAlchemyIngestionCheckpointStore,
)
from app.infrastructure.db.repositories.ingestion import SqlAlchemyIngestionRepository
from app.infrastructure.db.repositories.ingestion_parts import (
    SqlAlchemyIngestionPartRepository,
)
from app.infrastructure.db.repositories.ingestion_staging import (
    SqlAlchemyIngestionStagingRepository,
)
from app.infrastructure.db.session import SessionLocal
from app.services.ingestion.comment_collector import CommentCollector
from app.services.ingestion.part_preparation_service import (
    IngestionPartPreparationService,
)
from app.services.ingestion.prepared_stager import PreparedPhysicalIngestionStager
from app.services.ingestion.staging_writer import PhysicalIngestionStager

pytestmark = pytest.mark.anyio


async def seed_claim(session, marker: int):
    execution = VkExecution(
        id=UUID(f"{marker}1111111-1111-1111-1111-111111111111"),
        task_id=10,
        owner_user_id="owner",
        run_id=f"staged-page-run-{marker}",
        status="running",
        plan_snapshot={"source": {"provider": "vk", "externalId": "42"}},
    )
    attempt = VkExecutionAttempt(
        id=UUID(f"{marker}2222222-2222-2222-2222-222222222222"),
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
    await session.flush()
    return SimpleNamespace(
        execution_id=execution.id, attempt_id=attempt.id, fencing_token=7
    )


def adapter_for_one_page(owner_id: int, post_id: int, comment_id: int):
    async def iter_comment_pages(*args, **kwargs):
        yield {
            "items": [
                {
                    "id": comment_id,
                    "owner_id": owner_id,
                    "post_id": post_id,
                    "from_id": 5,
                    "text": "comment",
                    "date": 1_700_000_001,
                }
            ],
            "profiles": [{"id": 5, "first_name": "Alice"}],
            "groups": [],
            "count": 1,
        }
        yield {"items": [], "profiles": [], "groups": []}

    return SimpleNamespace(iter_comment_pages=iter_comment_pages)


async def persisted_state(execution_id, owner_id, post_id, run_id):
    async with SessionLocal() as session:
        staged = await session.scalar(
            select(func.count(VkIngestionStagingBatch.id)).where(
                VkIngestionStagingBatch.execution_id == execution_id,
                VkIngestionStagingBatch.source_kind == "comment_page",
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
        comments = await SqlAlchemyIngestionRepository(
            session
        ).count_comments_for_post(owner_id, post_id)
        checkpoint = await SqlAlchemyIngestionCheckpointStore(session).load(
            run_id, owner_id, post_id
        )
    return staged, parts, references, comments, checkpoint


async def run_page(marker: int, *, reject: bool):
    owner_id, post_id = -40 - marker, 90 + marker
    run_id = f"staged-page-run-{marker}"
    async with SessionLocal() as session:
        claim = await seed_claim(session, marker)

        async def commit_page():
            if reject:
                await session.rollback()
                raise RuntimeError("fence lost")
            await session.commit()

        physical = PhysicalIngestionStager.from_claim(
            SqlAlchemyIngestionStagingRepository(session), claim
        )
        staging = PreparedPhysicalIngestionStager(
            staging=physical,
            parts=IngestionPartPreparationService(
                SqlAlchemyIngestionPartRepository(session)
            ),
        )
        collector = CommentCollector(
            adapter=adapter_for_one_page(owner_id, post_id, marker),
            repository=SqlAlchemyIngestionRepository(session),
            staging=staging,
            require_staging=True,
            page_committer=commit_page,
        )
        call = collector.collect_for_post(
            owner_id=owner_id,
            post_id=post_id,
            post={"owner_id": owner_id, "id": post_id},
            author_profiles={},
            task_run=SimpleNamespace(task_id=10, run_id=run_id),
            checkpoint_store=SqlAlchemyIngestionCheckpointStore(session),
        )
        if reject:
            with pytest.raises(RuntimeError, match="fence lost"):
                await call
        else:
            await call
    return await persisted_state(claim.execution_id, owner_id, post_id, run_id)


async def test_stage_parts_references_comment_and_checkpoint_commit_atomically():
    staged, parts, references, comments, checkpoint = await run_page(4, reject=False)

    assert staged == 1
    assert parts == 1
    assert references == 1
    assert comments == 1
    assert checkpoint is not None


async def test_fence_rejection_rolls_back_complete_page_preparation():
    staged, parts, references, comments, checkpoint = await run_page(5, reject=True)

    assert staged == 0
    assert parts == 0
    assert references == 0
    assert comments == 0
    assert checkpoint is None
