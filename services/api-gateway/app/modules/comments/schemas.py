from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class CommentsListResponse(BaseModel):
    items: list[dict[str, Any]]
    total: int
    has_more: bool
    read_count: int
    unread_count: int


class CommentsCursorResponse(BaseModel):
    items: list[dict[str, Any]]
    next_cursor: str | None = None
    has_more: bool
    total: int
    read_count: int
    unread_count: int
