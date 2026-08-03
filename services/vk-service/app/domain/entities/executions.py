from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


TERMINAL_EXECUTION_STATUSES = frozenset({"done", "failed", "cancelled"})


@dataclass(frozen=True)
class VkExecution:
    id: UUID
    task_id: int
    owner_user_id: str
    run_id: str
    status: str
    scope: str
    mode: str
    group_ids: list[int]
    post_limit: int | None
    plan_snapshot: dict
    processed_items: int
    total_items: int
    last_error: str | None
    available_at: datetime
    current_attempt_id: UUID | None
    current_fencing_token: int
    cancellation_requested_at: datetime | None
    cancellation_reason: str | None
    parent_execution_id: UUID | None
    execution_sequence: int
    started_at: datetime | None
    finished_at: datetime | None
    created_at: datetime
    updated_at: datetime

    @property
    def is_terminal(self) -> bool:
        return self.status in TERMINAL_EXECUTION_STATUSES


@dataclass(frozen=True)
class VkExecutionAttempt:
    id: UUID
    execution_id: UUID
    attempt_number: int
    fencing_token: int
    worker_id: str
    status: str
    provider_account_key: str
    credential_version: str
    lease_expires_at: datetime
    heartbeat_at: datetime
    started_at: datetime
    finished_at: datetime | None
    last_error: str | None


@dataclass(frozen=True)
class VkExecutionClaim:
    execution: VkExecution
    attempt: VkExecutionAttempt

    @property
    def execution_id(self) -> UUID:
        return self.execution.id

    @property
    def attempt_id(self) -> UUID:
        return self.attempt.id

    @property
    def fencing_token(self) -> int:
        return self.attempt.fencing_token

    @property
    def attempt_number(self) -> int:
        return self.attempt.attempt_number

    @property
    def task_id(self) -> int:
        return self.execution.task_id

    @property
    def owner_user_id(self) -> str:
        return self.execution.owner_user_id

    @property
    def run_id(self) -> str:
        return self.execution.run_id

    @property
    def scope(self) -> str:
        return self.execution.scope

    @property
    def mode(self) -> str:
        return self.execution.mode

    @property
    def group_ids(self) -> list[int]:
        return self.execution.group_ids

    @property
    def post_limit(self) -> int | None:
        return self.execution.post_limit

    @property
    def processed_items(self) -> int:
        return self.execution.processed_items

    @property
    def total_items(self) -> int:
        return self.execution.total_items

    @property
    def provider_account_key(self) -> str:
        return self.attempt.provider_account_key

    @property
    def credential_version(self) -> str:
        return self.attempt.credential_version
