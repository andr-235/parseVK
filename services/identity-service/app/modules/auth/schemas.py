from uuid import UUID

from pydantic import BaseModel, Field

from app.modules.users.schemas import UserDto


class LoginRequest(BaseModel):
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=1)


class LogoutRequest(BaseModel):
    refresh_token: str = Field(min_length=1)


class MeRequest(BaseModel):
    user_id: UUID


class ChangePasswordRequest(BaseModel):
    user_id: UUID
    old_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8)


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UserDto
