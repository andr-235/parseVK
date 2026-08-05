"""Attach one canonical source demand to physical VK work."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.source_collections import SourceDemandAttachment
from app.infrastructure.db.models.executions import VkExecution, VkExecutionAttempt
from app.infrastructure.db.models.source_collections import (
    VkCollectionDemand,
    VkSourceCollection,
    VkTaskRunBinding,
)
from app.infrastructure.db.repositories.canonical_command_entities import (
    binding_entity,
    collection_entity,
    demand_entity,
)
from app.infrastructure.db.repositories.canonical_command_events import (
    mark_binding_started,
    utcnow,
)
from app.infrastructure.db.repositories.canonical_command_locks import advisory_lock
from app.infrastructure.db.repositories.executions import _execution_entity
from app.services.collection_fingerprint import build_collection_identity

ACTIVE_STATUSES = ("pending", "running")
SYSTEM_PROVIDER_ACCOUNT_KEY = "system-vk"


async def attach_source(
    session: AsyncSession,
    *,
    binding: VkTaskRunBinding,
    command,
    requested,
) -> SourceDemandAttachment:
    source = requested.source
    identity = build_collection_identity(
        provider_account_key=SYSTEM_PROVIDER_ACCOUNT_KEY,
        source_provider=source.provider,
        source_type=source.source_type,
        source_external_id=source.external_id,
        source_owner_id=source.owner_id,
        post_strategy=command.post_selection.strategy,
        post_limit=command.post_selection.limit_per_source,
        comment_mode=command.comment_selection.mode,
        include_thread_replies=command.comment_selection.include_thread_replies,
    )
    await advisory_lock(
        session,
        f"collection:{identity.provider_account_key}:"
        f"{identity.source_key}:{identity.fingerprint}",
    )

    collection = await session.scalar(
        select(VkSourceCollection)
        .where(
            VkSourceCollection.provider_account_key == identity.provider_account_key,
            VkSourceCollection.source_key == identity.source_key,
            VkSourceCollection.fingerprint == identity.fingerprint,
            VkSourceCollection.status.in_(ACTIVE_STATUSES),
        )
        .order_by(VkSourceCollection.created_at)
        .limit(1)
    )
    execution = None
    if collection is not None:
        execution = await session.scalar(
            select(VkExecution)
            .where(VkExecution.id == collection.execution_id)
            .with_for_update()
        )
        collection = await session.scalar(
            select(VkSourceCollection)
            .where(VkSourceCollection.id == collection.id)
            .with_for_update()
        )
        if (
            execution is None
            or collection is None
            or execution.status not in ACTIVE_STATUSES
            or collection.status not in ACTIVE_STATUSES
            or execution.cancellation_requested_at is not None
        ):
            execution = None
            collection = None

    outcome = "coalesced"
    if collection is None:
        outcome = "created"
        execution = VkExecution(
            task_id=command.task_id,
            owner_user_id=command.owner_user_id,
            run_id=str(command.task_run_id),
            status="pending",
            post_limit=command.post_selection.limit_per_source,
            plan_snapshot=identity.normalized_plan,
            available_at=utcnow(),
        )
        session.add(execution)
        await session.flush()
        collection = VkSourceCollection(
            execution_id=execution.id,
            provider_account_key=identity.provider_account_key,
            source_key=identity.source_key,
            source_id=source.source_id,
            source_provider=source.provider,
            source_type=source.source_type,
            source_external_id=source.external_id,
            source_owner_id=source.owner_id,
            fingerprint=identity.fingerprint,
            status="pending",
            plan_snapshot=identity.normalized_plan,
        )
        session.add(collection)
        await session.flush()

    joining_running = (
        execution.status == "running" and collection.status == "running"
    )
    demand = VkCollectionDemand(
        demand_id=requested.demand_id,
        binding_id=binding.id,
        collection_id=collection.id,
        source_id=source.source_id,
        task_id=command.task_id,
        run_id=str(command.task_run_id),
        owner_user_id=command.owner_user_id,
        task_revision=command.task_revision,
        source_set_revision=command.source_set_revision,
        snapshot_sha256=command.snapshot_sha256,
        status="running" if joining_running else "pending",
        execution_sequence=1 if joining_running else 0,
        stats={},
    )
    session.add(demand)
    await session.flush()

    if joining_running:
        attempt = await session.scalar(
            select(VkExecutionAttempt)
            .where(
                VkExecutionAttempt.id == execution.current_attempt_id,
                VkExecutionAttempt.status == "running",
            )
            .with_for_update()
        )
        if attempt is None:
            raise RuntimeError(
                f"running execution {execution.id} has no active attempt"
            )
        mark_binding_started(session, binding, attempt)

    return SourceDemandAttachment(
        outcome=outcome,
        binding=binding_entity(binding),
        collection=collection_entity(collection),
        demand=demand_entity(demand),
        execution=_execution_entity(execution),
    )
