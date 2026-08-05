from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from pydantic import AwareDatetime, field_validator

from ._base import ContractModel


class EnvelopeHeader(ContractModel):
    """Minimal header used to resolve a contract by semantic message type."""

    message_type: str


class MessageEnvelope[PayloadT: ContractModel](ContractModel):
    """Typed, unversioned Kafka message envelope."""

    message_id: UUID
    message_type: str
    occurred_at: AwareDatetime
    producer: str
    correlation_id: UUID | None = None
    causation_id: UUID | None = None
    payload: PayloadT

    @field_validator("occurred_at", mode="after")
    @classmethod
    def normalize_occurred_at(cls, value: datetime) -> datetime:
        return value.astimezone(UTC)
