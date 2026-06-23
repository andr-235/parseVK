from common.events import TaskEvent as _TaskEvent


class TaskEvent(_TaskEvent):
    def task_id(self) -> int:
        return int(self.payload["taskId"])

    def owner_user_id(self) -> str:
        return str(self.payload.get("ownerUserId") or "unknown")

    def scope(self) -> str:
        return str(self.payload.get("scope") or "all")

    def mode(self) -> str:
        return str(self.payload.get("mode") or "recent_posts")

    def group_ids(self) -> list[str]:
        return [str(item) for item in self.payload.get("groupIds") or []]

    def post_limit(self) -> int | None:
        value = self.payload.get("postLimit")
        return int(value) if value is not None else None

    def messenger(self) -> str | None:
        value = self.payload.get("messenger")
        return str(value) if value else None
