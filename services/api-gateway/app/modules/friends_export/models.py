from __future__ import annotations

"""
Shared Pydantic models for the friends export contract.

These types are used by both the VK and OK export paths.  They define
the wire format for REST responses and SSE events, keeping the UI
contract stable across provider migrations.

Ref: FASTAPI-MIG-010B / docs/FASTAPI_MIG_010_FRIENDS_EXPORT_INVENTORY.md
"""

from enum import StrEnum
from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Job status enum
# ---------------------------------------------------------------------------


class JobStatus(StrEnum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    DONE = "DONE"
    FAILED = "FAILED"


# ---------------------------------------------------------------------------
# REST response models
# ---------------------------------------------------------------------------


class FriendsExportStartResponse(BaseModel):
    """Returned by POST /vk/friends/export and POST /ok/friends/export."""

    jobId: str
    status: JobStatus


class FriendsJobLogEntry(BaseModel):
    """Single log entry attached to a job."""

    id: str
    level: Literal["info", "warn", "error"]
    message: str
    meta: Any = None
    createdAt: str


class FriendsJobState(BaseModel):
    """Full job state snapshot."""

    id: str
    status: JobStatus
    fetchedCount: int = 0
    totalCount: int = 0
    warning: str | None = None
    error: str | None = None
    xlsxPath: str | None = None
    createdAt: str


class FriendsJobDetailResponse(BaseModel):
    """Returned by GET /vk/friends/jobs/:jobId and GET /ok/friends/jobs/:jobId."""

    job: FriendsJobState
    logs: list[FriendsJobLogEntry]


# ---------------------------------------------------------------------------
# SSE event payload models
# ---------------------------------------------------------------------------


class ProgressEventData(BaseModel):
    """Payload of the 'progress' SSE event."""

    fetchedCount: int
    totalCount: int
    # True when the provider hard-limit (VK: 5 000 with fields; OK: 5 000) was hit.
    limitApplied: bool


class LogEventData(BaseModel):
    """Payload of the 'log' SSE event (mirrors a FriendsJobLogEntry without id/createdAt)."""

    level: Literal["info", "warn", "error"]
    message: str
    meta: Any = None


class DoneEventData(BaseModel):
    """Payload of the 'done' SSE event."""

    jobId: str
    status: Literal["DONE"] = "DONE"
    fetchedCount: int
    totalCount: int | None = None
    warning: str | None = None
    # Physical file path on the server — frontend uses it to trigger download.
    xlsxPath: str | None = None


class ErrorEventData(BaseModel):
    """
    Payload of the 'error' SSE event.

    IMPORTANT: must never expose raw provider error details that could
    contain tokens, session_key, or signatures.
    """

    message: str


# ---------------------------------------------------------------------------
# Discriminated SSE event wrapper
# ---------------------------------------------------------------------------

SseEventData = Annotated[
    ProgressEventData | LogEventData | DoneEventData | ErrorEventData,
    Field(discriminator=None),  # not discriminated at the model level — type is the tag
]


class SseProgressEvent(BaseModel):
    type: Literal["progress"] = "progress"
    data: ProgressEventData


class SseLogEvent(BaseModel):
    type: Literal["log"] = "log"
    data: LogEventData


class SseDoneEvent(BaseModel):
    type: Literal["done"] = "done"
    data: DoneEventData


class SseErrorEvent(BaseModel):
    type: Literal["error"] = "error"
    data: ErrorEventData


SseEvent = SseProgressEvent | SseLogEvent | SseDoneEvent | SseErrorEvent
