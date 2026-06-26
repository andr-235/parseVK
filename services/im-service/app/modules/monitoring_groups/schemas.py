from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MonitoringGroupCreateRequest(BaseModel):
    model_config = ConfigDict(alias_generator=lambda s: s, populate_by_name=True)

    messenger: str
    chat_id: str
    name: str
    category: str | None = None


class MonitoringGroupUpdateRequest(BaseModel):
    model_config = ConfigDict(alias_generator=lambda s: s, populate_by_name=True)

    name: str | None = None
    category: str | None = None


class MonitoringGroupResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    messenger: str
    chat_id: str
    name: str
    category: str | None = None
    created_at: datetime
    updated_at: datetime
