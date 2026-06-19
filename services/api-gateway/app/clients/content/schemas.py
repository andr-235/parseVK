from __future__ import annotations

from pydantic import BaseModel


class GroupBulkResponse(BaseModel):
    vkId: int
    name: str | None = None
    screenName: str | None = None
