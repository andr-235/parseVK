from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from parsevk_contracts.vk.commands import (
    CommentSelection,
    PostSelection,
    SourceReference,
    VkExecutionRequested,
    VkSourceDemandRequest,
)
from sqlalchemy import select

from app.domain.entities.provider_account import SYSTEM_VK_CAPABILITY
from app.infrastructure.db.models.outbox import OutboxEvent
from app.infrastructure.db.repositories.canonical_commands import (
    CanonicalVkCommandRepository,
)
from app.infrastructure.db.repositories.executions import (
    SqlAlchemyExecutionRepository,
)
from app.infrastructure.db.repositories.provider_accounts import (
    SqlAlchemyProviderAccountRepository,
)


@pytest.mark.anyio
async def test_progress_is_emitted_once_per_binding(db_session):
    await SqlAlchemyProviderAccountRepository(db_session).upsert_system(
        account_key="system-vk",
        provider="vk",
        credential_version="version-1",
        capabilities=[SYSTEM_VK_CAPABILITY],
    )
    command = VkExecutionRequested(
        task_id=7201,
        task_run_id=uuid4(),
        execution_id=uuid4(),
        owner_user_id="user-7201",
        demands=(
            VkSourceDemandRequest(
                demand_id=uuid4(),
                source=SourceReference(
                    source_id=uuid4(),
                    provider="vk",
                    source_type="community",
                    external_id="601",
                    owner_id=-601,
                ),
            ),
        ),
        post_selection=PostSelection(
            strategy="latestByPublishedAt",
            limit_per_source=10,
        ),
        comment_selection=CommentSelection(
            mode="all",
            include_thread_replies=True,
        ),
        task_revision=1,
        source_set_revision=1,
        snapshot_sha256="e" * 64,
    )
    await CanonicalVkCommandRepository(db_session).attach_command(command)
    executions = SqlAlchemyExecutionRepository(db_session)
    claim = await executions.claim_next(
        worker_id="worker-progress",
        lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
    )
    assert claim is not None

    emitted = await executions.report_progress(
        execution_id=claim.execution_id,
        processed_items=3,
        total_items=10,
        stats={"comments": 3},
        occurred_at=datetime.now(UTC).isoformat(),
    )

    assert emitted == 1
    events = list(
        await db_session.scalars(
            select(OutboxEvent).where(
                OutboxEvent.event_type == "task.execution_progressed"
            )
        )
    )
    assert len(events) == 1
    assert events[0].payload["processedItems"] == 3
    assert events[0].payload["totalItems"] == 10
