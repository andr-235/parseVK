from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

VK_EVENT_TYPES = (
    "vk.group_collected",
    "vk.group_deleted",
    "vk.author_collected",
    "vk.post_collected",
    "vk.comment_collected",
)
IM_EVENT_TYPES = ("im.message_collected", "im.group_collected")
UNKNOWN_EVENT_POLICY = "retry"


class EventEnvelope(BaseModel):
    event_id: UUID
    event_type: str
    event_version: int
    aggregate_id: str
    correlation_id: str | None = None


class VkGroupPayload(BaseModel):
    group: dict[str, Any]


class VkGroupDeletedPayload(BaseModel):
    vk_group_id: int = Field(alias="vkGroupId")


class VkAuthorPayload(BaseModel):
    author: dict[str, Any]


class VkPostPayload(BaseModel):
    post: dict[str, Any]
    task_id: int | None = Field(default=None, alias="taskId")


class VkCommentPayload(BaseModel):
    comment: dict[str, Any]
    task_id: int | None = Field(default=None, alias="taskId")


class VkEvent(EventEnvelope):
    event_type: Literal[*VK_EVENT_TYPES]
    payload: (
        VkGroupPayload
        | VkGroupDeletedPayload
        | VkAuthorPayload
        | VkPostPayload
        | VkCommentPayload
    )

    model_config = ConfigDict(populate_by_name=True)


class ImMessagePayload(BaseModel):
    messenger: str
    message_id: str = Field(alias="messageId")
    chat_id: str = Field(alias="chatId")


class ImGroupPayload(BaseModel):
    messenger: str
    chat_id: str = Field(alias="chatId")


class ImEvent(EventEnvelope):
    event_type: Literal[*IM_EVENT_TYPES]
    payload: ImMessagePayload | ImGroupPayload

    model_config = ConfigDict(populate_by_name=True)
