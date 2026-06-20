from typing import Any

from pydantic import BaseModel, ConfigDict, RootModel


class GroupSaveRequest(BaseModel):
    id: int
    name: str | None = None
    model_config = ConfigDict(extra="allow")


class IntegerList(RootModel[list[int]]):
    pass


class StringList(RootModel[list[str]]):
    pass


class JsonResponse(RootModel[dict[str, Any]]):
    pass
