from datetime import datetime

from pydantic import BaseModel, ConfigDict


class KeywordCreateRequest(BaseModel):
    model_config = ConfigDict(alias_generator=lambda s: s, populate_by_name=True)

    messenger: str
    keyword: str


class KeywordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    messenger: str
    keyword: str
    created_at: datetime
