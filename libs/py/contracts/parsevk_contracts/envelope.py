from __future__ import annotations

from datetime import datetime
from typing import Generic, TypeVar
from uuid import UUID

from ._base import ContractModel

PayloadT = TypeVar("PayloadT", bound=ContractModel)


class MessageEnvelope(ContractModel, Generic[PayloadT]):
    """Typed message envelope for Kafka events.

    Pure DTO — no business methods, no validation logic.
    Validation boundaries are enforced by the catalog layer.
    """

    message_id: UUID
    message_type: str
    schema_version: int
    occurred_at: datetime
    producer: str
    correlation_id: UUID | None = None
    causation_id: UUID | None = None
    payload: PayloadT
