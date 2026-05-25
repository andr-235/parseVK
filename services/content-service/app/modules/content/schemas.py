from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class PageResponse(BaseModel):
    items: list[dict[str, Any]]
    total: int
    page: int
    limit: int
    total_pages: int = Field(alias="totalPages")
    has_more: bool = Field(alias="hasMore")

    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True)


def dt(value: datetime | None) -> str | None:
    return value.isoformat() if value else None
