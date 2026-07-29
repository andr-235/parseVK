from __future__ import annotations

from typing import Any

from .catalog import ContractCatalog
from .envelope import MessageEnvelope
from .errors import (
    CausationPolicyError,
    ConsumerNotAllowedError,
    ContractValidationError,
    CorrelationPolicyError,
    ProducerNotAllowedError,
    UnknownContractError,
)


def validate_for_publish(
    catalog: ContractCatalog,
    envelope: MessageEnvelope[Any],
    producer: str,
) -> None:
    """Validate a fully constructed envelope for publishing.

    Combines envelope-level checks with catalog validation.
    """
    try:
        catalog.validate_for_publish(
            message_type=envelope.message_type,
            schema_version=envelope.schema_version,
            producer=producer,
            payload=envelope.payload.to_wire(),
            correlation_id=str(envelope.correlation_id) if envelope.correlation_id else None,
            causation_id=str(envelope.causation_id) if envelope.causation_id else None,
        )
    except (UnknownContractError, ProducerNotAllowedError,
            CorrelationPolicyError, CausationPolicyError,
            ContractValidationError):
        raise


def validate_for_consume(
    catalog: ContractCatalog,
    envelope: MessageEnvelope[Any],
    consumer: str,
) -> None:
    """Validate a received envelope for consumption.

    Combines envelope-level checks with catalog validation.
    """
    try:
        catalog.validate_for_consume(
            message_type=envelope.message_type,
            schema_version=envelope.schema_version,
            consumer=consumer,
            payload=envelope.payload.to_wire(),
        )
    except (UnknownContractError, ConsumerNotAllowedError,
            ContractValidationError):
        raise
