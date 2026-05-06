from uuid import UUID

from pydantic import BaseModel, Field


class AuthUser(BaseModel):
    id: UUID
    username: str
    role: str
    is_active: bool
    is_superuser: bool


class LoginRequest(BaseModel):
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8)


class AuthResponse(BaseModel):
    access_token: str
    user: AuthUser
