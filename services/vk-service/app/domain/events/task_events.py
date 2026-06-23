from typing import Literal

from common.events import ConsumerEvent


class TaskEvent(ConsumerEvent):
    event_type: Literal["task.created", "task.resumed", "task.deleted", "task.cancelled", "task.failed"]
