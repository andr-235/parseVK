from dataclasses import dataclass
from datetime import datetime
from typing import Literal
from uuid import UUID

ACTIVE_COLLECTION_STATUSES = frozenset({"pending", "running"})
ACTIVE_DEMAND_STATUSES = frozenset({"pending", "running"})
TERMINAL_DEMAND_STATUSES = frozenset({"done", "failed", "cancelled"})
ACTIVE_BINDING_STATUSES = frozenset({"pending", "running"})
TERMINAL_BINDING_STATUSES = frozenset({"done", "failed", "cancelled"})


@dataclass(frozen=True)
class TaskRunBinding:
    id: UUID
    command_execution_id: UUID
    task_id: int
    run_id: str
    owner_user_id: str
    task_revision: int
    source_set_revision: int
    snapshot_sha256: str
    expected_demands: int
    completed_demands: int
    failed_demands: int
    cancelled_demands: int
    processed_items: int
    total_items: int
    stats: dict
    status: str
    execution_sequence: int
    cancellation_requested_at: datetime | None
    cancellation_reason: str | None
    last_error: str | None
    started_at: datetime | None
    finished_at: datetime | None
    created_at: datetime
    updated_at: datetime

    @property
    def is_active(self) -> bool:
        return self.status in ACTIVE_BINDING_STATUSES


@dataclass(frozen=True)
class SourceCollection:
    id: UUID
    execution_id: UUID
    provider_account_key: str
    source_key: str
    source_id: UUID
    source_provider: str
    source_type: str
    source_external_id: str
    source_owner_id: int
    fingerprint: str
    status: str
    plan_snapshot: dict
    started_at: datetime | None
    finished_at: datetime | None
    last_error: str | None
    created_at: datetime
    updated_at: datetime

    @property
    def is_active(self) -> bool:
        return self.status in ACTIVE_COLLECTION_STATUSES


@dataclass(frozen=True)
class CollectionDemand:
    id: UUID
    demand_id: UUID
    binding_id: UUID
    collection_id: UUID
    source_id: UUID
    task_id: int
    run_id: str
    owner_user_id: str
    task_revision: int
    source_set_revision: int
    snapshot_sha256: str
    status: str
    execution_sequence: int
    processed_items: int
    total_items: int
    stats: dict
    cancellation_requested_at: datetime | None
    cancellation_reason: str | None
    last_error: str | None
    created_at: datetime
    updated_at: datetime
    finished_at: datetime | None

    @property
    def is_active(self) -> bool:
        return self.status in ACTIVE_DEMAND_STATUSES


SourceDemandAttachOutcome = Literal[
    "created",
    "coalesced",
    "duplicate",
]


@dataclass(frozen=True)
class SourceDemandAttachment:
    outcome: SourceDemandAttachOutcome
    binding: TaskRunBinding
    collection: SourceCollection
    demand: CollectionDemand
    execution: object

    @property
    def collection_created(self) -> bool:
        return self.outcome == "created"


CommandAttachOutcome = Literal[
    "created",
    "duplicate",
    "conflict",
]


@dataclass(frozen=True)
class CommandAttachmentResult:
    outcome: CommandAttachOutcome
    binding: TaskRunBinding | None
    attachments: tuple[SourceDemandAttachment, ...]
    reason: str | None = None
