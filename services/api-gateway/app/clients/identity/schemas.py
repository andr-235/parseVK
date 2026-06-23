from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel


class IdentityUser(BaseModel):
    id: UUID
    username: str
    role: str
    is_active: bool
    is_superuser: bool
    is_temporary_password: bool = False


class IdentityLoginRequest(BaseModel):
    username: str
    password: str


class IdentityRefreshRequest(BaseModel):
    refresh_token: str


class IdentityLogoutRequest(BaseModel):
    refresh_token: str


class IdentityChangePasswordRequest(BaseModel):
    user_id: UUID
    old_password: str
    new_password: str


class IdentityAuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: IdentityUser
