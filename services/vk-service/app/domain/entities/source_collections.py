from dataclasses import dataclass
from datetime import datetime
from typing import Literal
from uuid import UUID

ACTIVE_COLLECTION_STATUSES = frozenset({"pending", "running"})
ACTIVE_DEMAND_STATUSES = frozenset({"pending", "running"})
TERMINAL_DEMAND_STATUSES = frozenset({"done", "failed", "cancelled"})


@dataclass(frozen=True)
class SourceCollection:
    id: UUID
    execution_id: UUID
    identity_version: int
    provider_account_key: str
    source_key: str
    source_id: UUID | None
    source_provider: str | None
    source_type: str | None
    source_external_id: str | None
    source_owner_id: int | None
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
    collection_id: UUID
    source_id: UUID | None
    task_id: int
    run_id: str
    owner_user_id: str
    task_revision: int | None
    source_set_revision: int | None
    snapshot_sha256: str | None
    status: str
    execution_sequence: int
    cancellation_requested_at: datetime | None
    cancellation_reason: str | None
    last_error: str | None
    created_at: datetime
    updated_at: datetime
    finished_at: datetime | None

    @property
    def is_active(self) -> bool:
        return self.status in ACTIVE_DEMAND_STATUSES


@dataclass(frozen=True)
class DemandAttachment:
    collection: SourceCollection
    demand: CollectionDemand
    execution: object
    collection_created: bool


SourceDemandAttachOutcome = Literal[
    "created",
    "coalesced",
    "duplicate",
    "conflict",
]


@dataclass(frozen=True)
class SourceDemandAttachment:
    outcome: SourceDemandAttachOutcome
    collection: SourceCollection
    demand: CollectionDemand
    execution: object

    @property
    def collection_created(self) -> bool:
        return self.outcome == "created"
