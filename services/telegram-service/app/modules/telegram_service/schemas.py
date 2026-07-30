from datetime import datetime
from enum import StrEnum
from typing import Any

from common.schemas import CamelModel


class TelegramJobStatus(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    DONE = "done"
    FAILED = "failed"
    CANCELLED = "cancelled"

    @classmethod
    def _missing_(cls, value: Any) -> "TelegramJobStatus | None":
        if isinstance(value, str):
            normalized = value.lower()
            for member in cls:
                if member.value == normalized:
                    return member
        return None


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
