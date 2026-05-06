from uuid import UUID

from pydantic import BaseModel


class UserDto(BaseModel):
    id: UUID
    username: str
    role: str
    is_active: bool
    is_superuser: bool
