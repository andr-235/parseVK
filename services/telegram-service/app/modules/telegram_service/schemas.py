from datetime import datetime
from enum import Enum

from common.schemas import CamelModel


class TelegramJobStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    DONE = "DONE"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


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
