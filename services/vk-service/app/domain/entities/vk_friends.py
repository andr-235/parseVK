from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(frozen=True)
class VkFriendsExportJob:
    id: UUID
    status: str
    params: dict
    vk_user_id: int | None
    total_count: int | None
    fetched_count: int
    warning: str | None
    error: str | None
    xlsx_path: str | None
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True)
class VkFriendsJobLog:
    id: int
    job_id: UUID
    level: str
    message: str
    meta: dict | None
    created_at: datetime


@dataclass(frozen=True)
class VkFriendsRecord:
    id: int
    job_id: UUID
    vk_friend_id: int
    payload: dict
    created_at: datetime
