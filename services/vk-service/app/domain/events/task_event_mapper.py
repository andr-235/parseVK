from common.events import TaskEvent


class TaskEventMapper:
    @staticmethod
    def get_task_id(event: TaskEvent) -> int:
        return int(event.payload["taskId"])

    @staticmethod
    def get_owner_user_id(event: TaskEvent) -> str:
        return str(event.payload.get("ownerUserId") or "unknown")

    @staticmethod
    def get_scope(event: TaskEvent) -> str:
        return str(event.payload.get("scope") or "all")

    @staticmethod
    def get_mode(event: TaskEvent) -> str:
        return str(event.payload.get("mode") or "recent_posts")

    @staticmethod
    def get_group_ids(event: TaskEvent) -> list[int]:
        return [int(item) for item in event.payload.get("groupIds") or []]

    @staticmethod
    def get_post_limit(event: TaskEvent) -> int | None:
        value = event.payload.get("postLimit")
        return int(value) if value is not None else None

    @staticmethod
    def get_requested_run_id(event: TaskEvent) -> str:
        return str(event.payload.get("runId") or event.event_id)

    @staticmethod
    def get_terminal_run_id(event: TaskEvent) -> str | None:
        value = event.payload.get("runId")
        if value:
            return str(value)
        if event.event_type in {"task.completed", "task.failed"}:
            return event.correlation_id
        return None
