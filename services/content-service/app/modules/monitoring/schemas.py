from pydantic import BaseModel


class MonitorMessageResponse(BaseModel):
    id: str
    text: str | None = None
    createdAt: str | None = None
    author: str | None = None
    chat: str | None = None
    source: str | None = None
    contentUrl: str | None = None
    contentType: str | None = None


class MonitorMessagesResponse(BaseModel):
    items: list[MonitorMessageResponse]
    total: int
    usedKeywords: list[str]
    lastSyncAt: str
    page: int
    limit: int
    hasMore: bool
