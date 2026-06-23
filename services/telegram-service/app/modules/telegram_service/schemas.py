from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class TelegramJobStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    DONE = "DONE"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class TelegramExportStartResponse(CamelModel):
    job_id: str
    status: str


class TelegramJobLogEntry(CamelModel):
    id: str
    level: str
    message: str
    created_at: datetime


class TelegramJobState(CamelModel):
    id: str
    status: TelegramJobStatus
    fetched_count: int = 0
    total_count: int = 0
    warning: str | None = None
    error: str | None = None
    xlsx_path: str | None = None
    created_at: datetime


class TelegramJobDetailResponse(CamelModel):
    job: TelegramJobState
    logs: list[TelegramJobLogEntry]
