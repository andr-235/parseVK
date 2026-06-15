from datetime import datetime

from pydantic import BaseModel


class TelegramExportStartRequest(BaseModel):
    target: str = ""
    limit: int = 500
    activeOnly: bool = False
    verifyPhones: bool = False


class TelegramExportStartResponse(BaseModel):
    jobId: str
    status: str


class TelegramJobLogEntry(BaseModel):
    id: str
    level: str
    message: str
    createdAt: datetime


class TelegramJobState(BaseModel):
    id: str
    status: str
    fetchedCount: int = 0
    totalCount: int = 0
    warning: str | None = None
    error: str | None = None
    xlsxPath: str | None = None
    createdAt: datetime


class TelegramJobDetailResponse(BaseModel):
    job: TelegramJobState
    logs: list[TelegramJobLogEntry]
