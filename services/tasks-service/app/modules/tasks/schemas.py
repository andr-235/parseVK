from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

Scope = Literal["all", "selected"]
Mode = Literal["recent_posts", "recheck_group"]
Status = Literal["pending", "running", "done", "failed", "cancelled"]
Source = Literal["manual", "automation"]


class CreateParseTaskRequest(BaseModel):
    scope: Scope = "all"
    group_ids: list[int] = Field(default_factory=list, alias="groupIds")
    post_limit: int = Field(default=10, ge=1, le=100, alias="postLimit")
    mode: Mode = "recent_posts"

    model_config = ConfigDict(populate_by_name=True)

    @model_validator(mode="after")
    def normalize_group_ids(self) -> "CreateParseTaskRequest":
        self.group_ids = [int(item) for item in self.group_ids]
        if self.scope == "selected" and not self.group_ids:
            raise ValueError("groupIds is required for selected scope")
        if self.scope == "all":
            self.group_ids = []
        return self


class TaskResponse(BaseModel):
    id: int
    title: str
    description: dict[str, Any] | None
    completed: bool
    total_items: int = Field(alias="totalItems")
    processed_items: int = Field(alias="processedItems")
    progress: float
    status: Status
    scope: Scope | None
    mode: Mode | None
    group_ids: list[int] = Field(alias="groupIds")
    post_limit: int | None = Field(alias="postLimit")
    source: Source
    stats: dict[str, Any] | None
    error: str | None
    skipped_groups_message: str | None = Field(alias="skippedGroupsMessage")
    created_at: datetime | str = Field(alias="createdAt")
    updated_at: datetime | str = Field(alias="updatedAt")

    model_config = ConfigDict(populate_by_name=True)


class TaskListResponse(BaseModel):
    tasks: list[TaskResponse]
    total: int
    page: int
    limit: int
    total_pages: int = Field(alias="totalPages")
    has_more: bool = Field(alias="hasMore")

    model_config = ConfigDict(populate_by_name=True)


class TaskAuditLogResponse(BaseModel):
    id: int
    task_id: int | None = Field(alias="taskId")
    aggregate_type: str = Field(alias="aggregateType")
    aggregate_id: str | None = Field(alias="aggregateId")
    event_type: str = Field(alias="eventType")
    event_data: dict[str, Any] | None = Field(alias="eventData")
    created_at: datetime | str = Field(alias="createdAt")

    model_config = ConfigDict(populate_by_name=True)


class ExecutionStartRequest(BaseModel):
    run_id: str = Field(alias="runId")
    worker: str

    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True)


class ExecutionProgressRequest(BaseModel):
    run_id: str = Field(alias="runId")
    processed_items: int = Field(ge=0, alias="processedItems")
    total_items: int = Field(ge=0, alias="totalItems")
    progress: float = Field(ge=0, le=1)
    stats: dict[str, Any] | None = None

    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True)

    @model_validator(mode="after")
    def validate_counts(self) -> "ExecutionProgressRequest":
        if self.processed_items > self.total_items:
            raise ValueError("processedItems must be less than or equal to totalItems")
        return self


class ExecutionCompleteRequest(BaseModel):
    run_id: str = Field(alias="runId")
    processed_items: int = Field(ge=0, alias="processedItems")
    total_items: int = Field(ge=0, alias="totalItems")
    stats: dict[str, Any] | None = None

    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True)

    @model_validator(mode="after")
    def validate_counts(self) -> "ExecutionCompleteRequest":
        if self.processed_items > self.total_items:
            raise ValueError("processedItems must be less than or equal to totalItems")
        return self


class ExecutionFailRequest(BaseModel):
    run_id: str = Field(alias="runId")
    error: str = Field(min_length=1, max_length=2000)
    processed_items: int = Field(default=0, ge=0, alias="processedItems")
    total_items: int = Field(default=0, ge=0, alias="totalItems")
    stats: dict[str, Any] | None = None

    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True)

    @model_validator(mode="after")
    def validate_counts(self) -> "ExecutionFailRequest":
        if self.processed_items > self.total_items:
            raise ValueError("processedItems must be less than or equal to totalItems")
        return self
