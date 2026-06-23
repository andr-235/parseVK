from enum import StrEnum

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


class CreateUserRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    username: str = Field(min_length=3, max_length=64, pattern=USERNAME_PATTERN)
    password: str = Field(min_length=12, max_length=128)
    role: UserRole = UserRole.USER


class UpdateUserRequest(BaseModel):
    model_config = ConfigDict(alias_generator=lambda value: {
        "is_active": "isActive",
    }.get(value, value), populate_by_name=True)

    is_active: bool | None = None
    role: UserRole | None = None

    @model_validator(mode="after")
    def require_update(self):
        if self.is_active is None and self.role is None:
            raise ValueError("At least one field must be provided")
        return self
