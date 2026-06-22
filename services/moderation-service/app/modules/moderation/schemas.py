from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CommentModerationState(BaseModel):
    id: int
    external_key: str
    post_external_key: str
    text: str | None
    date: datetime | None
    author_vk_id: int | None
    is_read: bool
    status: str
    source: str
    matched_keywords: list[str]

    model_config = ConfigDict(from_attributes=True)


class UpdateCommentReadStatus(BaseModel):
    is_read: bool


class UpdateCommentStatus(BaseModel):
    status: str


class VkEvent(BaseModel):
    event_id: UUID
    event_type: str
    event_version: int
    aggregate_id: str
    correlation_id: str | None = None
    payload: dict

    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True)


class CommentModerationList(BaseModel):
    items: list[CommentModerationState]
    total: int
    has_more: bool
    read_count: int
    unread_count: int


class CommentModerationCursorList(BaseModel):
    items: list[CommentModerationState]
    next_cursor: str | None
    has_more: bool
    total: int
    read_count: int
    unread_count: int

