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

from app.domain.entities.provider_account import SYSTEM_VK_CAPABILITY
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
async def test_stale_attempt_cannot_complete_after_reclaim(db_session):
    await SqlAlchemyProviderAccountRepository(db_session).upsert_system(
        account_key="system-vk",
        provider="vk",
        credential_version="version-1",
        capabilities=[SYSTEM_VK_CAPABILITY],
    )
    command = VkExecutionRequested(
        task_id=7301,
        task_run_id=uuid4(),
        execution_id=uuid4(),
        owner_user_id="user-7301",
        demands=(
            VkSourceDemandRequest(
                demand_id=uuid4(),
                source=SourceReference(
                    source_id=uuid4(),
                    provider="vk",
                    source_type="community",
                    external_id="701",
                    owner_id=-701,
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
        snapshot_sha256="f" * 64,
    )
    await CanonicalVkCommandRepository(db_session).attach_command(command)
    repository = SqlAlchemyExecutionRepository(db_session)
    first = await repository.claim_next(
        worker_id="worker-old",
        lease_expires_at=datetime.now(UTC) - timedelta(seconds=1),
    )
    assert first is not None
    second = await repository.claim_next(
        worker_id="worker-new",
        lease_expires_at=datetime.now(UTC) + timedelta(minutes=1),
    )
    assert second is not None
    assert second.fencing_token > first.fencing_token

    assert not await repository.complete(
        execution_id=first.execution_id,
        attempt_id=first.attempt_id,
        fencing_token=first.fencing_token,
        processed_items=1,
        total_items=1,
        stats={},
    )
    assert await repository.complete(
        execution_id=second.execution_id,
        attempt_id=second.attempt_id,
        fencing_token=second.fencing_token,
        processed_items=1,
        total_items=1,
        stats={},
    )
