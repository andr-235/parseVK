from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

USERNAME_PATTERN = r"^[A-Za-z0-9._-]+$"


class UserRole(StrEnum):
    ADMIN = "admin"
    USER = "user"


class UserSortField(StrEnum):
    USERNAME = "username"
    ROLE = "role"
    IS_ACTIVE = "isActive"
    IS_TEMPORARY_PASSWORD = "isTemporaryPassword"
    CREATED_AT = "createdAt"


class SortDirection(StrEnum):
    ASC = "asc"
    DESC = "desc"


class UserDto(BaseModel):
    id: UUID
    username: str
    role: UserRole
    is_active: bool
    is_superuser: bool
    is_temporary_password: bool = False


class CreateUserRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    username: str = Field(min_length=3, max_length=64, pattern=USERNAME_PATTERN)
    password: str = Field(min_length=12, max_length=128)
    role: UserRole = UserRole.USER


class UpdateUserRequest(BaseModel):
    is_active: bool | None = None
    role: UserRole | None = None

    @model_validator(mode="after")
    def require_update(self):
        if self.is_active is None and self.role is None:
            raise ValueError("At least one field must be provided")
        return self


class UserListQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=25, alias="pageSize", ge=1, le=100)
    search: str | None = Field(default=None, max_length=64)
    role: UserRole | None = None
    is_active: bool | None = Field(default=None, alias="isActive")
    is_temporary_password: bool | None = Field(default=None, alias="isTemporaryPassword")
    sort_by: UserSortField = Field(default=UserSortField.CREATED_AT, alias="sortBy")
    sort_dir: SortDirection = Field(default=SortDirection.DESC, alias="sortDir")
    model_config = ConfigDict(populate_by_name=True)


class UserResponse(BaseModel):
    id: UUID
    username: str
    role: UserRole
    is_active: bool
    created_at: datetime
    is_temporary_password: bool


class UserListResponse(BaseModel):
    items: list[UserResponse]
    page: int
    page_size: int = Field(alias="pageSize")
    total: int
    total_pages: int = Field(alias="totalPages")
    model_config = ConfigDict(populate_by_name=True)


class TemporaryPasswordResponse(BaseModel):
    temporaryPassword: str
