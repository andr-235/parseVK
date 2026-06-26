from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotifierStateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: str
    messenger: str
    last_seen_message_id: int | None = None
    updated_at: datetime


class NotifierStateUpdateRequest(BaseModel):
    model_config = ConfigDict(alias_generator=lambda s: s, populate_by_name=True)

    messenger: str
    last_seen_message_id: int
