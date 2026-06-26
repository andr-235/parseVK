from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SearchMessageItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    messenger: str
    external_id: str
    chat_external_id: str
    chat_name: str | None = None
    author: str | None = None
    text: str | None = None
    content_url: str | None = None
    content_type: str | None = None
    created_at: datetime | None = None
    ingested_at: datetime


class SearchResponse(BaseModel):
    items: list[SearchMessageItem]
    total: int
    page: int
    limit: int
