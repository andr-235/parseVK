from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

logger = logging.getLogger(__name__)


class ImMessageCollectedPayload(BaseModel):
    model_config = ConfigDict(extra="ignore")

    messenger: str
    messageId: str
    chatId: str
    chatName: str | None = None
    authorId: str | None = None
    authorName: str | None = None
    text: str | None = None
    contentUrl: str | None = None
    contentType: str | None = None
    createdAt: datetime | None = None
    metadata: dict[str, Any] | None = None


class VkCommentsCollectedV1(BaseModel):
    model_config = ConfigDict(extra="ignore")

    batchId: str
    chunkIndex: int
    chunkCount: int
    comments: list[dict]
    authors: list[dict]
    sourcePosition: str | None = None
    taskId: int | None = None
    runId: str | None = None


class ContentCommentsProjectedV1(BaseModel):
    model_config = ConfigDict(extra="ignore")

    insertedCount: int
    updatedCount: int
    totalCount: int
    projectionRevision: int
    taskId: int | None = None
    runId: str | None = None
    ownerId: int | None = None
    postId: int | None = None
    batchId: str | None = None
    projectedAt: str


class ContentCanonicalCommentV1(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ownerId: int
    postId: int
    commentId: int
    authorId: int | None = None
    text: str | None = None
    createdAt: str | None = None


class ContentCanonicalCommentsChangedV1(BaseModel):
    """Content-owned moderation feed emitted from durable canonical ingestion."""

    model_config = ConfigDict(extra="forbid")

    sourceService: Literal["content-service"]
    sourceMessageId: str
    batchId: str
    postKey: str
    postRevision: int = Field(gt=0)
    chunkIndex: int = Field(ge=0)
    chunkCount: int = Field(gt=0)
    comments: list[ContentCanonicalCommentV1]

    @model_validator(mode="after")
    def validate_chunk_bounds(self):
        if self.chunkIndex >= self.chunkCount:
            raise ValueError("chunkIndex must be smaller than chunkCount")
        return self


class TaskStateChangedV1(BaseModel):
    model_config = ConfigDict(extra="ignore")

    taskId: int
    runId: str | None = None
    ownerUserId: int
    status: str
    taskRevision: int
    processedItems: int | None = None
    totalItems: int | None = None
    progress: float | None = None
    stats: dict | None = None
    changedAt: str


def validate_im_payload(
    event_version: int, payload: dict[str, Any]
) -> ImMessageCollectedPayload | dict[str, Any]:
    """Validate IM message payload by event version.

    v1: passthrough (return dict as-is)
    v2: validate against ImMessageCollectedPayload schema
    unknown: log warning, treat as v1
    """
    if event_version == 2:
        try:
            return ImMessageCollectedPayload.model_validate(payload)
        except Exception as exc:
            logger.warning("v2 payload validation failed: %s", exc)
            raise
    if event_version != 1:
        logger.warning("Unknown IM event version %d, treating as v1", event_version)
    logger.debug("Validating IM payload: version=%d (passthrough)", event_version)
    return payload
