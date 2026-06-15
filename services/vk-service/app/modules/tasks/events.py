from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class TaskEvent(BaseModel):
    event_id: UUID
    event_type: Literal["task.created", "task.resumed", "task.deleted"]
    event_version: int
    aggregate_id: str
    correlation_id: str | None = None
    payload: dict[str, Any]

    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True)

    def task_id(self) -> int:
        return int(self.payload["taskId"])

    def owner_user_id(self) -> str:
        return str(self.payload.get("ownerUserId") or "unknown")

    def scope(self) -> str:
        return str(self.payload.get("scope") or "all")

    def mode(self) -> str:
        return str(self.payload.get("mode") or "recent_posts")

    def group_ids(self) -> list[int]:
        return [int(item) for item in self.payload.get("groupIds") or []]

    def post_limit(self) -> int | None:
        value = self.payload.get("postLimit")
        return int(value) if value is not None else None
