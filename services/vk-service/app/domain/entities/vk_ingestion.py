from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class VkGroup:
    vk_group_id: int
    screen_name: str | None
    name: str | None
    is_closed: bool | None
    raw: dict
    first_seen_at: datetime
    last_seen_at: datetime
    deleted_at: datetime | None


@dataclass(frozen=True)
class VkAuthor:
    vk_author_id: int
    author_type: str
    display_name: str | None
    raw: dict
    first_seen_at: datetime
    last_seen_at: datetime


@dataclass(frozen=True)
class VkPost:
    vk_post_id: int
    vk_owner_id: int
    vk_group_id: int | None
    author_vk_id: int | None
    date: datetime | None
    text: str | None
    raw: dict
    first_task_id: int
    last_task_id: int
    first_seen_at: datetime
    last_seen_at: datetime


@dataclass(frozen=True)
class VkComment:
    vk_comment_id: int
    vk_owner_id: int
    vk_post_id: int
    author_vk_id: int | None
    date: datetime | None
    text: str | None
    raw: dict
    first_task_id: int
    last_task_id: int
    first_seen_at: datetime
    last_seen_at: datetime
