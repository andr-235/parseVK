"""Sources module Pydantic schemas."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

Provider = Literal["vk"]
SourceKind = Literal["target", "reference"]
SourceStatus = Literal["active", "inactive"]


def canonical_external_id(value: str) -> str:
    """Return a positive canonical ASCII decimal identifier."""
    if not value.isascii() or not value.isdigit():
        raise ValueError("externalId must be a positive numeric string")
    try:
        parsed = int(value)
    except ValueError as exc:
        raise ValueError("externalId must be a positive numeric string") from exc
    if parsed <= 0:
        raise ValueError("externalId must be a positive numeric string")
    return str(parsed)


class CreateSourceRequest(BaseModel):
    provider: Provider = "vk"
    source_type: str = Field(
        default="community",
        min_length=1,
        max_length=32,
        alias="sourceType",
    )
    external_id: str = Field(min_length=1, max_length=64, alias="externalId")
    display_name: str | None = Field(
        default=None,
        max_length=255,
        alias="displayName",
    )

    model_config = ConfigDict(populate_by_name=True)
    external_id_digits = field_validator("external_id")(canonical_external_id)


class SourceResponse(BaseModel):
    id: UUID
    provider: str
    source_type: str = Field(alias="sourceType")
    external_id: str = Field(alias="externalId")
    owner_id: int = Field(alias="ownerId")
    display_name: str | None = Field(default=None, alias="displayName")
    status: SourceStatus
    revision: int
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class SourceListResponse(BaseModel):
    sources: list[SourceResponse]
    total: int


class TaskSourceRequest(BaseModel):
    provider: Provider = "vk"
    source_type: str = Field(
        default="community",
        min_length=1,
        max_length=32,
        alias="sourceType",
    )
    external_id: str = Field(min_length=1, max_length=64, alias="externalId")
    kind: SourceKind = "target"

    model_config = ConfigDict(populate_by_name=True)
    external_id_digits = field_validator("external_id")(canonical_external_id)


class TaskSourceResponse(BaseModel):
    id: UUID
    task_id: int = Field(alias="taskId")
    source: SourceResponse
    kind: SourceKind
    revision: int
    created_at: datetime = Field(alias="createdAt")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class CreateAccessScopeRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class AccessScopeResponse(BaseModel):
    id: UUID
    owner_user_id: str = Field(alias="ownerUserId")
    name: str
    created_by_user_id: str = Field(alias="createdByUserId")
    created_at: datetime = Field(alias="createdAt")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class GrantAccessRequest(BaseModel):
    provider: Provider = "vk"
    source_type: str = Field(
        default="community",
        min_length=1,
        max_length=32,
        alias="sourceType",
    )
    external_id: str = Field(min_length=1, max_length=64, alias="externalId")

    model_config = ConfigDict(populate_by_name=True)
    external_id_digits = field_validator("external_id")(canonical_external_id)


class ScopeSourceAccessResponse(BaseModel):
    access_scope_id: UUID = Field(alias="accessScopeId")
    source: SourceResponse
    ref_count: int = Field(alias="refCount")
    revoked_at: datetime | None = Field(default=None, alias="revokedAt")
    revoked_by: str | None = Field(default=None, alias="revokedBy")
    created_at: datetime = Field(alias="createdAt")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)
