from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(frozen=True)
class VkTaskRun:
    id: UUID
    task_id: int
    owner_user_id: str
    run_id: str
    status: str
    scope: str
    mode: str
    group_ids: list[int]
    post_limit: int | None
    started_at: datetime | None
    finished_at: datetime | None
    processed_items: int
    total_items: int
    last_error: str | None
    attempts: int
    available_at: datetime
    lease_owner: str | None
    lease_expires_at: datetime | None
    heartbeat_at: datetime | None
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True)
class ProcessedEvent:
    id: int
    consumer_name: str
    event_id: UUID
    event_type: str
    processed_at: datetime
    retry_count: int
    last_error: str | None
    next_retry_at: datetime | None
