from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(frozen=True)
class OkFriendsExportJob:
    id: UUID
    status: str
    params: dict
    ok_user_id: int | None
    total_count: int | None
    fetched_count: int
    warning: str | None
    error: str | None
    xlsx_path: str | None
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True)
class OkFriendsJobLog:
    id: int
    job_id: UUID
    level: str
    message: str
    meta: dict | None
    created_at: datetime


@dataclass(frozen=True)
class OkFriendsRecord:
    id: int
    job_id: UUID
    ok_friend_id: int
    payload: dict
    created_at: datetime
