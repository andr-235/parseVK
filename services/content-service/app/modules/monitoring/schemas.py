from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class MonitoringGroupBase(BaseModel):
    messenger: str = Field(..., description="whatsapp or max")
    chat_id: str = Field(..., description="ID чата во внешней системе")
    name: str = Field(..., description="Название чата/группы")
    category: str | None = Field(default=None, description="Категория группы")


class MonitoringGroupCreate(MonitoringGroupBase):
    pass


class MonitoringGroupUpdate(BaseModel):
    messenger: str | None = None
    chat_id: str | None = None
    name: str | None = None
    category: str | None = None


class MonitoringGroupResponse(MonitoringGroupBase):
    id: int
    created_at: datetime | None = Field(default=None)
    updated_at: datetime | None = Field(default=None)

    model_config = ConfigDict(from_attributes=True)


class MonitoringGroupsResponse(BaseModel):
    items: list[MonitoringGroupResponse]
    total: int


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
