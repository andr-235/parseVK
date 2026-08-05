from datetime import UTC, datetime
from uuid import uuid4

from common.events.task_execution_failed import TaskExecutionFailedPayload
from common.events.task_execution_started import TaskExecutionStartedPayload
from sqlalchemy import or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.source_collections import (
    CollectionDemand,
    CommandAttachmentResult,
    SourceCollection,
    SourceDemandAttachment,
    TaskRunBinding,
)
from app.infrastructure.db.models.executions import VkExecution, VkExecutionAttempt
from app.infrastructure.db.models.outbox import OutboxEvent
from app.infrastructure.db.models.source_collections import (
    VkCollectionDemand,
    VkSourceCollection,
    VkTaskRunBinding,
)
from app.infrastructure.db.repositories.executions import _execution_entity
from app.services.collection_fingerprint import build_collection_identity

ACTIVE_BINDING_STATUSES = ("pending", "running")
ACTIVE_COLLECTION_STATUSES = ("pending", "running")
EXECUTOR = "vk-service"
SYSTEM_PROVIDER_ACCOUNT_KEY = "system-vk"


def utcnow() -> datetime:
    return datetime.now(UTC)


def _as_utc(value: datetime | None) -> datetime | None:
    if value is None or value.tzinfo is not None:
        return value
    return value.replace(tzinfo=UTC)


def _binding_entity(model: VkTaskRunBinding) -> TaskRunBinding:
    return TaskRunBinding(
        id=model.id,
        command_execution_id=model.command_execution_id,
        task_id=model.task_id,
        run_id=model.run_id,
        owner_user_id=model.owner_user_id,
        task_revision=model.task_revision,
        source_set_revision=model.source_set_revision,
        snapshot_sha256=model.snapshot_sha256,
        expected_demands=model.expected_demands,
        completed_demands=model.completed_demands,
        failed_demands=model.failed_demands,
        cancelled_demands=model.cancelled_demands,
        processed_items=model.processed_items,
        total_items=model.total_items,
        stats=dict(model.stats or {}),
        status=model.status,
        execution_sequence=model.execution_sequence,
        cancellation_requested_at=_as_utc(model.cancellation_requested_at),
        cancellation_reason=model.cancellation_reason,
        last_error=model.last_error,
        started_at=_as_utc(model.started_at),
        finished_at=_as_utc(model.finished_at),
        created_at=_as_utc(model.created_at),
        updated_at=_as_utc(model.updated_at),
    )


def _collection_entity(model: VkSourceCollection) -> SourceCollection:
    return SourceCollection(
        id=model.id,
        execution_id=model.execution_id,
        provider_account_key=model.provider_account_key,
        source_key=model.source_key,
        source_id=model.source_id,
        source_provider=model.source_provider,
        source_type=model.source_type,
        source_external_id=model.source_external_id,
        source_owner_id=model.source_owner_id,
        fingerprint=model.fingerprint,
        status=model.status,
        plan_snapshot=dict(model.plan_snapshot or {}),
        started_at=_as_utc(model.started_at),
        finished_at=_as_utc(model.finished_at),
        last_error=model.last_error,
        created_at=_as_utc(model.created_at),
        updated_at=_as_utc(model.updated_at),
    )


def _demand_entity(model: VkCollectionDemand) -> CollectionDemand:
    return CollectionDemand(
        id=model.id,
        demand_id=model.demand_id,
        binding_id=model.binding_id,
        collection_id=model.collection_id,
        source_id=model.source_id,
        task_id=model.task_id,
        run_id=model.run_id,
        owner_user_id=model.owner_user_id,
        task_revision=model.task_revision,
        source_set_revision=model.source_set_revision,
        snapshot_sha256=model.snapshot_sha256,
        status=model.status,
        execution_sequence=model.execution_sequence,
        processed_items=model.processed_items,
        total_items=model.total_items,
        stats=dict(model.stats or {}),
        cancellation_requested_at=_as_utc(model.cancellation_requested_at),
        cancellation_reason=model.cancellation_reason,
        last_error=model.last_error,
        created_at=_as_utc(model.created_at),
        updated_at=_as_utc(model.updated_at),
        finished_at=_as_utc(model.finished_at),
    )


class CanonicalVkCommandRepository:
    """Attach immutable command demands to physical source collections."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def attach_command(self, command) -> CommandAttachmentResult:
        await self._advisory_lock(f"task:{command.task_id}")
        existing = await self.session.scalar(
            select(VkTaskRunBinding)
            .where(
                or_(
                    VkTaskRunBinding.command_execution_id == command.execution_id,
                    (
                        (VkTaskRunBinding.task_id == command.task_id)
                        & (VkTaskRunBinding.run_id == str(command.task_run_id))
                    ),
                )
            )
            .with_for_update()
        )
        if existing is not None:
            if self._same_command(existing, command):
                return CommandAttachmentResult(
                    outcome="duplicate",
                    binding=_binding_entity(existing),
                    attachments=(),
                )
            return CommandAttachmentResult(
                outcome="conflict",
                binding=_binding_entity(existing),
                attachments=(),
                reason="command identity conflicts with an existing TaskRun binding",
            )

        active = await self.session.scalar(
            select(VkTaskRunBinding)
            .where(
                VkTaskRunBinding.task_id == command.task_id,
                VkTaskRunBinding.status.in_(ACTIVE_BINDING_STATUSES),
            )
            .with_for_update()
        )
        if active is not None:
            return CommandAttachmentResult(
                outcome="conflict",
                binding=_binding_entity(active),
                attachments=(),
                reason="another TaskRun for this task is still active",
            )

        now = utcnow()
        binding = VkTaskRunBinding(
            command_execution_id=command.execution_id,
            task_id=command.task_id,
            run_id=str(command.task_run_id),
            owner_user_id=command.owner_user_id,
            task_revision=command.task_revision,
            source_set_revision=command.source_set_revision,
            snapshot_sha256=command.snapshot_sha256,
            expected_demands=len(command.demands),
            status="pending",
            stats={},
            created_at=now,
            updated_at=now,
        )
        self.session.add(binding)
        await self.session.flush()

        attachments = tuple(
            [
                await self._attach_source(
                    binding=binding,
                    command=command,
                    requested=requested,
                )
                for requested in command.demands
            ]
        )
        return CommandAttachmentResult(
            outcome="created",
            binding=_binding_entity(binding),
            attachments=attachments,
        )

    async def emit_rejection(self, command, reason: str) -> None:
        now = utcnow()
        payload = TaskExecutionFailedPayload(
            taskId=command.task_id,
            runId=str(command.task_run_id),
            ownerUserId=command.owner_user_id,
            executor=EXECUTOR,
            workerId="vk-command-consumer",
            executionSequence=1,
            processedItems=0,
            totalItems=0,
            stats={},
            error=reason[:2000],
            failureKind="rejected",
            failedAt=now.isoformat(),
        )
        self._add_outbox(
            event_type="task.execution_failed",
            task_id=command.task_id,
            dedupe_key=f"task.execution_failed:rejected:{command.execution_id}",
            payload=payload.model_dump(mode="json"),
            now=now,
        )

    async def _attach_source(self, *, binding, command, requested):
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
        await self._advisory_lock(
            f"collection:{identity.provider_account_key}:"
            f"{identity.source_key}:{identity.fingerprint}"
        )

        collection = await self.session.scalar(
            select(VkSourceCollection)
            .where(
                VkSourceCollection.provider_account_key
                == identity.provider_account_key,
                VkSourceCollection.source_key == identity.source_key,
                VkSourceCollection.fingerprint == identity.fingerprint,
                VkSourceCollection.status.in_(ACTIVE_COLLECTION_STATUSES),
            )
            .order_by(VkSourceCollection.created_at)
            .limit(1)
        )
        execution = None
        if collection is not None:
            execution = await self.session.scalar(
                select(VkExecution)
                .where(VkExecution.id == collection.execution_id)
                .with_for_update()
            )
            collection = await self.session.scalar(
                select(VkSourceCollection)
                .where(VkSourceCollection.id == collection.id)
                .with_for_update()
            )
            if (
                execution is None
                or collection is None
                or execution.status not in ACTIVE_COLLECTION_STATUSES
                or collection.status not in ACTIVE_COLLECTION_STATUSES
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
                scope="selected",
                mode="recent_posts",
                group_ids=[int(source.external_id)],
                post_limit=command.post_selection.limit_per_source,
                plan_snapshot=identity.normalized_plan,
                available_at=utcnow(),
            )
            self.session.add(execution)
            await self.session.flush()
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
            self.session.add(collection)
            await self.session.flush()

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
        self.session.add(demand)
        await self.session.flush()

        if joining_running:
            attempt = await self.session.scalar(
                select(VkExecutionAttempt).where(
                    VkExecutionAttempt.id == execution.current_attempt_id,
                    VkExecutionAttempt.status == "running",
                )
            )
            if attempt is None:
                raise RuntimeError(
                    f"running execution {execution.id} has no active attempt"
                )
            await self._mark_binding_started(binding, attempt)

        return SourceDemandAttachment(
            outcome=outcome,
            binding=_binding_entity(binding),
            collection=_collection_entity(collection),
            demand=_demand_entity(demand),
            execution=_execution_entity(execution),
        )

    async def _mark_binding_started(
        self,
        binding: VkTaskRunBinding,
        attempt: VkExecutionAttempt,
    ) -> None:
        if binding.status != "pending":
            return
        now = utcnow()
        binding.status = "running"
        binding.started_at = binding.started_at or now
        binding.execution_sequence += 1
        binding.updated_at = now
        payload = TaskExecutionStartedPayload(
            taskId=binding.task_id,
            runId=binding.run_id,
            ownerUserId=binding.owner_user_id,
            executor=EXECUTOR,
            workerId=attempt.worker_id,
            attempt=attempt.attempt_number,
            executionSequence=binding.execution_sequence,
            providerAccountKey=attempt.provider_account_key,
            credentialVersion=attempt.credential_version,
            startedAt=now.isoformat(),
        )
        self._add_outbox(
            event_type="task.execution_started",
            task_id=binding.task_id,
            dedupe_key=f"task.execution_started:{binding.id}",
            payload=payload.model_dump(mode="json", exclude_none=True),
            now=now,
        )

    @staticmethod
    def _same_command(binding: VkTaskRunBinding, command) -> bool:
        return (
            binding.command_execution_id == command.execution_id
            and binding.task_id == command.task_id
            and binding.run_id == str(command.task_run_id)
            and binding.owner_user_id == command.owner_user_id
            and binding.task_revision == command.task_revision
            and binding.source_set_revision == command.source_set_revision
            and binding.snapshot_sha256 == command.snapshot_sha256
            and binding.expected_demands == len(command.demands)
        )

    def _add_outbox(
        self,
        *,
        event_type: str,
        task_id: int,
        dedupe_key: str,
        payload: dict,
        now: datetime,
    ) -> None:
        self.session.add(
            OutboxEvent(
                id=uuid4(),
                event_type=event_type,
                aggregate_type="task",
                aggregate_id=str(task_id),
                dedupe_key=dedupe_key,
                payload=payload,
                status="pending",
                attempts=0,
                next_attempt_at=now,
                created_at=now,
            )
        )

    async def _advisory_lock(self, lock_key: str) -> None:
        bind = self.session.get_bind()
        if bind.dialect.name != "postgresql":
            return
        await self.session.execute(
            text("SELECT pg_advisory_xact_lock(hashtext(:lock_key))"),
            {"lock_key": lock_key},
        )
