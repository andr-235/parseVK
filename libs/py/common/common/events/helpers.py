"""Shared helper functions for working with task events in consumers."""

from common.events import TaskEvent


def get_task_id(event: TaskEvent) -> int | None:
    """Extract task_id from event payload."""
    value = event.payload.get("taskId") or event.payload.get("task_id")
    return int(value) if value is not None else None


def get_owner_user_id(event: TaskEvent) -> str:
    """Extract owner_user_id from event payload."""
    return str(event.payload.get("ownerUserId") or event.payload.get("owner_user_id") or "unknown")


def get_scope(event: TaskEvent) -> str | None:
    """Extract task scope from event payload."""
    value = event.payload.get("scope")
    return str(value) if value is not None else None


def get_mode(event: TaskEvent) -> str | None:
    """Extract task mode from event payload."""
    value = event.payload.get("mode")
    return str(value) if value is not None else None


def get_group_ids(event: TaskEvent) -> list[str]:
    """Extract group_ids list from event payload."""
    items = event.payload.get("groupIds") or event.payload.get("group_ids") or []
    return [str(item) for item in items]


def get_post_limit(event: TaskEvent) -> int | None:
    """Extract post_limit from event payload."""
    value = event.payload.get("postLimit") or event.payload.get("post_limit")
    return int(value) if value is not None else None


def get_messenger(event: TaskEvent) -> str | None:
    """Extract messenger from event payload."""
    value = event.payload.get("messenger")
    return str(value) if value is not None else None
