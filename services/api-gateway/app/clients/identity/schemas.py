from uuid import UUID

<<<<<<< HEAD
from pydantic import BaseModel, Field
=======
from pydantic import BaseModel
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da


class IdentityUser(BaseModel):
    id: UUID
    username: str
    role: str
    is_active: bool
    is_superuser: bool


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
