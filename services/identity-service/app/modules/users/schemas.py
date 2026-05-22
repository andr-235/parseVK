from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class UserDto(BaseModel):
    id: UUID
    username: str
    role: str
    is_active: bool
    is_superuser: bool


class CreateUserRequest(BaseModel):
    username: str
    password: str
    role: str | None = "user"


class UserResponse(BaseModel):
    id: UUID
    username: str
    role: str
    created_at: datetime
    is_temporary_password: bool = False


class TemporaryPasswordResponse(BaseModel):
    temporaryPassword: str
