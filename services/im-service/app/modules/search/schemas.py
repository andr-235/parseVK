from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


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
    matched_keywords: list[str] = Field(default_factory=list)


class SearchResponse(BaseModel):
    items: list[SearchMessageItem]
    total: int
    page: int
    limit: int


class SearchMessagesRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    messenger: str | None = None
    query: str | None = None
    chat_id: str | None = Field(default=None, alias='chatId')
    date_from: datetime | None = Field(default=None, alias='dateFrom')
    date_to: datetime | None = Field(default=None, alias='dateTo')
    only_with_keywords: bool = Field(default=False, alias='onlyWithKeywords')
    keywords: list[str] = Field(default_factory=list)
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=50, ge=1, le=200)
