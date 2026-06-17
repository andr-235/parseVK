from datetime import datetime

from pydantic import BaseModel, ConfigDict


class WatchlistSettingsSchema(BaseModel):
    id: int
    track_all_comments: bool
    poll_interval_minutes: int
    max_authors: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WatchlistSettingsUpdateSchema(BaseModel):
    track_all_comments: bool | None = None
    poll_interval_minutes: int | None = None
    max_authors: int | None = None


class WatchlistAuthorSchema(BaseModel):
    id: int
    author_vk_id: int
    source_comment_id: int | None
    status: str
    last_checked_at: datetime | None
    last_activity_at: datetime | None
    found_comments_count: int
    monitoring_started_at: datetime
    monitoring_stopped_at: datetime | None
    settings_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CreateWatchlistAuthorSchema(BaseModel):
    author_vk_id: int | None = None
    comment_id: int | None = None


class UpdateWatchlistAuthorSchema(BaseModel):
    status: str


class CommentDto(BaseModel):
    id: int
    ownerId: int
    postId: int
    vkCommentId: int
    text: str | None
    publishedAt: datetime | None
    createdAt: datetime
    source: str

    model_config = ConfigDict(from_attributes=True)


class PaginatedComments(BaseModel):
    items: list[CommentDto]
    total: int
    hasMore: bool


class WatchlistAuthorDetailsSchema(WatchlistAuthorSchema):
    comments: PaginatedComments


class WatchlistAuthorListSchema(BaseModel):
    items: list[WatchlistAuthorSchema]
    total: int
    hasMore: bool
