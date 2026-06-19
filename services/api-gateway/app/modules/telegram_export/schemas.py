from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class TelegramExportStartRequest(BaseModel):
    target: str = Field(..., description="Link, username or numeric ID of Telegram group/channel")
    limit: int = Field(default=500, ge=1)
    activeOnly: bool = Field(default=False)
    verifyPhones: bool = Field(default=False)

class TelegramExportStartResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    jobId: str = Field(..., alias="jobId")
    status: str

class TelegramJobState(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    status: str
    fetchedCount: int = Field(..., alias="fetchedCount")
    totalCount: int = Field(..., alias="totalCount")
    warning: str | None = None
    error: str | None = None
    xlsxPath: str | None = Field(default=None, alias="xlsxPath")
    createdAt: str = Field(..., alias="createdAt")

class TelegramJobLogEntry(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    level: str
    message: str
    createdAt: str = Field(..., alias="createdAt")

class TelegramJobDetailResponse(BaseModel):
    job: TelegramJobState
    logs: list[TelegramJobLogEntry]
