from __future__ import annotations

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class GroupItem(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: int
    vk_id: int
    vk_group_id: int
    name: str | None = None
    screen_name: str | None = None
    is_closed: int | None = None
    deactivated: str | None = None
    type: str | None = None
    photo_50: str | None = None
    photo_100: str | None = None
    photo_200: str | None = None
    activity: str | None = None
    age_limits: int | None = None
    description: str | None = None
    members_count: int | None = None
    status: str | None = None
    verified: int | None = None
    wall: int | None = None
    addresses: dict | None = None
    city: dict | None = None
    counters: dict | None = None
    exists_in_db: bool


class GroupMergeResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    total: int
    groups: list[GroupItem]
    exists_in_db: list[GroupItem]
    missing: list[GroupItem]
