from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class JobStatus(StrEnum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    DONE = "DONE"
    FAILED = "FAILED"


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


class VkFriendsExportStartRequest(BaseModel):
    params: dict[str, Any]


class VkFriendsExportStartResponse(CamelModel):
    job_id: str
    status: JobStatus


class VkFriendsJobLogEntry(CamelModel):
    id: str
    level: str
    message: str
    meta: Any = None
    created_at: datetime


class VkFriendsJobState(CamelModel):
    id: str
    status: JobStatus
    fetched_count: int = 0
    total_count: int = 0
    warning: str | None = None
    error: str | None = None
    xlsx_path: str | None = None
    created_at: datetime


class VkFriendsJobDetailResponse(CamelModel):
    job: VkFriendsJobState
    logs: list[VkFriendsJobLogEntry]
