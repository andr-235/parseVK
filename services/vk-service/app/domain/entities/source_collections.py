from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

ACTIVE_COLLECTION_STATUSES = frozenset({"pending", "running"})
ACTIVE_DEMAND_STATUSES = frozenset({"pending", "running"})
TERMINAL_DEMAND_STATUSES = frozenset({"done", "failed", "cancelled"})


@dataclass(frozen=True)
class SourceCollection:
    id: UUID
    execution_id: UUID
    provider_account_key: str
    source_key: str
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
    collection_id: UUID
    task_id: int
    run_id: str
    owner_user_id: str
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
