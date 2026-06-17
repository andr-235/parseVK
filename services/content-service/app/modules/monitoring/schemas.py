from datetime import datetime
from typing import Literal
<<<<<<< HEAD
from pydantic import BaseModel, Field, ConfigDict
=======

from pydantic import BaseModel, ConfigDict, Field
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da


class MonitoringGroupBase(BaseModel):
    messenger: Literal["whatsapp", "max"] = Field(..., description="whatsapp or max")
    chat_id: str = Field(..., alias="chatId", description="ID чата во внешней системе")
    name: str = Field(..., description="Название чата/группы")
    category: str | None = Field(default=None, description="Категория группы")

    model_config = ConfigDict(populate_by_name=True)



class MonitoringGroupCreate(MonitoringGroupBase):
    pass


class MonitoringGroupUpdate(BaseModel):
    messenger: Literal["whatsapp", "max"] | None = None
    chat_id: str | None = Field(default=None, alias="chatId", description="ID чата во внешней системе")
    name: str | None = None
    category: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class MonitoringGroupResponse(MonitoringGroupBase):
    id: int
    created_at: datetime | None = Field(default=None, alias="createdAt")
    updated_at: datetime | None = Field(default=None, alias="updatedAt")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


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

