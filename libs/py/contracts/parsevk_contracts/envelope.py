from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from pydantic import AwareDatetime, field_validator

from ._base import ContractModel


class EnvelopeHeader(ContractModel):
    """Lightweight model for pre-parsing envelope header fields.

    Used solely to extract message_type and schema_version
    before looking up the contract in parse_for_consume.
    """

    message_type: str
    schema_version: int


class MessageEnvelope[PayloadT: ContractModel](ContractModel):
    """Typed message envelope for Kafka events.

    Pure DTO — no business methods, no validation logic.
    Validation boundaries are enforced by the catalog layer.
    """

    message_id: UUID
    message_type: str
    schema_version: int
    occurred_at: AwareDatetime
    producer: str
    correlation_id: UUID | None = None
    causation_id: UUID | None = None
    payload: PayloadT

    @field_validator("occurred_at", mode="after")
    @classmethod
    def normalize_occurred_at(cls, value: datetime) -> datetime:
        return value.astimezone(UTC)
