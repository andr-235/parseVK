from typing import Literal

TaskEventType = Literal[
    "task.created",
    "task.resumed",
    "task.automation_run_requested",
    "task.automation_settings_updated",
    "task.deleted",
    "task.cancelled",
    "task.completed",
    "task.failed",
    "task.execution_started",
    "task.checked",
]

VkEventType = Literal[
    "vk.group_collected",
    "vk.group_deleted",
    "vk.author_collected",
    "vk.post_collected",
    "vk.comment_collected",
    "vk.task_progress_updated",
    "vk.task_completed",
    "vk.task_failed",
]

ImEventType = Literal[
    "im.message_collected",
    "im.group_collected",
    "im.task_progress_updated",
    "im.task_completed",
    "im.task_failed",
]

IdentityEventType = Literal[
    "identity.user_created",
    "identity.user_logged_in",
    "identity.user_logged_out",
    "identity.password_changed",
]
