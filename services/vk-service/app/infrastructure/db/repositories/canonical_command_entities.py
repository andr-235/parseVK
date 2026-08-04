"""Domain projections for canonical VK command persistence."""

from datetime import UTC, datetime

from app.domain.entities.source_collections import (
    CollectionDemand,
    SourceCollection,
    TaskRunBinding,
)
from app.infrastructure.db.models.source_collections import (
    VkCollectionDemand,
    VkSourceCollection,
    VkTaskRunBinding,
)


def _as_utc(value: datetime | None) -> datetime | None:
    if value is None or value.tzinfo is not None:
        return value
    return value.replace(tzinfo=UTC)


def binding_entity(model: VkTaskRunBinding) -> TaskRunBinding:
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


def collection_entity(model: VkSourceCollection) -> SourceCollection:
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


def demand_entity(model: VkCollectionDemand) -> CollectionDemand:
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
