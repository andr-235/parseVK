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


class OkFriendsExportStartRequest(BaseModel):
    params: dict[str, Any]


class OkFriendsExportStartResponse(CamelModel):
    job_id: str
    status: JobStatus


class OkFriendsJobLogEntry(CamelModel):
    id: str
    level: str
    message: str
    meta: Any = None
    created_at: datetime


class OkFriendsJobState(CamelModel):
    id: str
    status: JobStatus
    fetched_count: int = 0
    total_count: int = 0
    warning: str | None = None
    error: str | None = None
    xlsx_path: str | None = None
    created_at: datetime


class OkFriendsJobDetailResponse(CamelModel):
    job: OkFriendsJobState
    logs: list[OkFriendsJobLogEntry]
