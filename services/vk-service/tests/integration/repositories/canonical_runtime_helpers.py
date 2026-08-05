"""Builders shared by canonical VK repository integration tests."""

from uuid import UUID, uuid4

from parsevk_contracts.vk.commands import (
    CommentSelection,
    PostSelection,
    SourceReference,
    VkExecutionCancelRequested,
    VkExecutionRequested,
    VkSourceDemandRequest,
)

from app.domain.entities.provider_account import SYSTEM_VK_CAPABILITY
from app.infrastructure.db.repositories.canonical_commands import (
    CanonicalVkCommandRepository,
)
from app.infrastructure.db.repositories.provider_accounts import (
    SqlAlchemyProviderAccountRepository,
)


def make_command(
    *,
    task_id: int,
    source_id: UUID,
    external_id: int = 777,
    post_limit: int = 10,
) -> VkExecutionRequested:
    run_id = uuid4()
    execution_id = uuid4()
    return VkExecutionRequested(
        task_id=task_id,
        task_run_id=run_id,
        execution_id=execution_id,
        owner_user_id=f"user-{task_id}",
        demands=(
            VkSourceDemandRequest(
                demand_id=uuid4(),
                source=SourceReference(
                    source_id=source_id,
                    provider="vk",
                    source_type="community",
                    external_id=str(external_id),
                    owner_id=-external_id,
                ),
            ),
        ),
        post_selection=PostSelection(
            strategy="latestByPublishedAt",
            limit_per_source=post_limit,
        ),
        comment_selection=CommentSelection(
            mode="all",
            include_thread_replies=True,
        ),
        task_revision=1,
        source_set_revision=1,
        snapshot_sha256="a" * 64,
    )


def cancel_command(command: VkExecutionRequested) -> VkExecutionCancelRequested:
    return VkExecutionCancelRequested(
        task_id=command.task_id,
        task_run_id=command.task_run_id,
        execution_id=command.execution_id,
        owner_user_id=command.owner_user_id,
        reason="task.cancelled",
    )


async def attach(db_session, command: VkExecutionRequested):
    return await CanonicalVkCommandRepository(db_session).attach_command(command)


async def seed_account(db_session) -> None:
    await SqlAlchemyProviderAccountRepository(db_session).upsert_system(
        account_key="system-vk",
        provider="vk",
        credential_version="version-1",
        capabilities=[SYSTEM_VK_CAPABILITY],
    )
