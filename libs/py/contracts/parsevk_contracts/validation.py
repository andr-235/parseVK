"""Real boundary API for contract validation.

Usage:
    # Publish: caller provides raw payload, gets back a PreparedMessage
    prepared = prepare_for_publish(
        catalog,
        message_type="vk.execution.requested",
        schema_version=1,
        producer="tasks-service",
        message_id=uuid4(),
        occurred_at=datetime.now(timezone.utc),
        correlation_id=execution_id,
        causation_id=None,
        payload=raw_payload_dict,
    )
    # prepared.envelope is a typed MessageEnvelope[VkExecutionRequested]
    # prepared.bytes is the JSON bytes ready for Kafka

    # Consume: caller provides raw bytes from Kafka
    parsed = parse_for_consume(
        catalog,
        consumer="vk-service",
        topic="parsevk.vk.commands",
        value=b'{...}',
    )
    # parsed.envelope is a typed MessageEnvelope[VkExecutionRequested]
    # parsed.envelope.payload is a VkExecutionRequested instance
"""

from __future__ import annotations

import json
from datetime import datetime
from typing import Generic, NamedTuple
from uuid import UUID

from ._base import ContractModel
from .catalog import ContractCatalog, MessageContract
from .envelope import MessageEnvelope
from .errors import (
    CausationPolicyError,
    ConsumerNotAllowedError,
    ContractValidationError,
    CorrelationPolicyError,
    InvalidEnvelopeError,
    ProducerNotAllowedError,
    UnknownContractError,
)


class PreparedMessage(NamedTuple):
    """Result of prepare_for_publish."""

    envelope: MessageEnvelope[ContractModel]
    headers: dict[str, str]
    bytes: bytes


class ParsedMessage(NamedTuple):
    """Result of parse_for_consume."""

    envelope: MessageEnvelope[ContractModel]
    headers: dict[str, str]


def prepare_for_publish(
    catalog: ContractCatalog,
    *,
    message_type: str,
    schema_version: int,
    producer: str,
    message_id: UUID,
    occurred_at: datetime,
    correlation_id: UUID | None = None,
    causation_id: UUID | None = None,
    payload: dict[str, object],
) -> PreparedMessage:
    """Prepare a message for publishing.

    1. Looks up contract by message_type + schema_version
    2. Validates producer is allowed
    3. Validates payload with extra="forbid"
    4. Builds the typed envelope
    5. Returns PreparedMessage with envelope, headers, and bytes
    """
    contract = catalog.get(message_type, schema_version)

    if producer not in contract.producers:
        raise ProducerNotAllowedError(
            f"Service '{producer}' is not allowed to publish '{message_type}'"
        )

    # Validate payload with strict mode (extra="forbid")
    try:
        payload_model = contract.payload_model.model_validate(payload, extra="forbid")
    except Exception as exc:
        raise ContractValidationError(
            f"Payload validation failed for '{message_type}': {exc}"
        ) from exc

    envelope = MessageEnvelope(
        message_id=message_id,
        message_type=message_type,
        schema_version=schema_version,
        occurred_at=occurred_at,
        producer=producer,
        correlation_id=correlation_id,
        causation_id=causation_id,
        payload=payload_model,
    )

    # Validate envelope-level policy
    _enforce_envelope_policy(contract, envelope)

    headers = {
        "message_type": message_type,
        "schema_version": str(schema_version),
        "content_type": "application/json",
    }
    bytes_data = envelope.to_wire_json().encode("utf-8")

    return PreparedMessage(envelope=envelope, headers=headers, bytes=bytes_data)


def parse_for_consume(
    catalog: ContractCatalog,
    *,
    consumer: str,
    topic: str,
    value: bytes,
) -> ParsedMessage:
    """Parse and validate a received Kafka message.

    1. JSON-decodes the bytes
    2. Extracts header fields (message_type, schema_version)
    3. Looks up contract
    4. Validates consumer is allowed
    5. Builds typed envelope with extra="ignore" (tolerant consumer)
    6. Enforces envelope policy (correlation, causation)
    7. Returns ParsedMessage with typed envelope
    """
    try:
        raw: dict[str, object] = json.loads(value)
    except json.JSONDecodeError as exc:
        raise InvalidEnvelopeError(f"Invalid JSON: {exc}") from exc

    message_type = raw.get("message_type")
    if not isinstance(message_type, str):
        message_type = raw.get("messageType")
    if not isinstance(message_type, str):
        raise InvalidEnvelopeError("Missing message_type in envelope")

    schema_version = raw.get("schema_version")
    if not isinstance(schema_version, int):
        schema_version = raw.get("schemaVersion")
    if not isinstance(schema_version, int):
        raise InvalidEnvelopeError("Missing schema_version in envelope")

    contract = catalog.get(message_type, schema_version)

    if consumer not in contract.consumers:
        raise ConsumerNotAllowedError(
            f"Service '{consumer}' is not allowed to consume '{message_type}'"
        )

    # Validate with extra="ignore" (tolerant consumer)
    try:
        envelope_raw = MessageEnvelope[ContractModel].model_validate(
            raw, extra="ignore"
        )
    except Exception as exc:
        raise InvalidEnvelopeError(f"Invalid envelope: {exc}") from exc

    # Now re-validate with the correct payload model
    payload_raw: dict[str, object] = {}
    if isinstance(raw.get("payload"), dict):
        payload_raw = raw["payload"]  # type: ignore[assignment]

    try:
        typed_payload = contract.payload_model.model_validate(
            payload_raw, extra="ignore"
        )
    except Exception as exc:
        raise ContractValidationError(
            f"Payload validation failed for '{message_type}': {exc}"
        ) from exc

    envelope = MessageEnvelope(
        message_id=envelope_raw.message_id,
        message_type=message_type,
        schema_version=schema_version,
        occurred_at=envelope_raw.occurred_at,
        producer=envelope_raw.producer,
        correlation_id=envelope_raw.correlation_id,
        causation_id=envelope_raw.causation_id,
        payload=typed_payload,
    )

    # Enforce envelope policy on consume too
    _enforce_envelope_policy(contract, envelope)

    # Consumer must also verify producer is legit
    if envelope.producer not in contract.producers:
        raise ProducerNotAllowedError(
            f"Envelope producer '{envelope.producer}' is not allowed "
            f"to publish '{message_type}'"
        )

    headers = {
        "message_type": message_type,
        "schema_version": str(schema_version),
        "content_type": "application/json",
    }

    return ParsedMessage(envelope=envelope, headers=headers)


def _enforce_envelope_policy(
    contract: MessageContract,
    envelope: MessageEnvelope,
) -> None:
    """Enforce correlation and causation policy for an envelope."""
    if contract.correlation_required and envelope.correlation_id is None:
        raise CorrelationPolicyError(
            f"correlationId is required for '{contract.message_type}'"
        )
    if contract.causation_policy == "required" and envelope.causation_id is None:
        raise CausationPolicyError(
            f"causationId is required for '{contract.message_type}'"
        )
    if contract.causation_policy == "forbidden" and envelope.causation_id is not None:
        raise CausationPolicyError(
            f"causationId is forbidden for '{contract.message_type}'"
        )


# Legacy helpers - kept for backward compatibility but deprecated
def validate_for_publish(
    catalog: ContractCatalog,
    envelope: MessageEnvelope,
    producer: str,
) -> None:
    """Legacy: validate a fully constructed envelope for publishing.

    Deprecated: use prepare_for_publish instead.
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
        # Verify envelope producer matches
        if envelope.producer != producer:
            raise ProducerNotAllowedError(
                f"Envelope producer '{envelope.producer}' does not match "
                f"expected producer '{producer}'"
            )
    except (UnknownContractError, ProducerNotAllowedError,
            CorrelationPolicyError, CausationPolicyError,
            ContractValidationError):
        raise


def validate_for_consume(
    catalog: ContractCatalog,
    envelope: MessageEnvelope,
    consumer: str,
) -> None:
    """Legacy: validate a received envelope for consumption.

    Deprecated: use parse_for_consume instead.
    """
    try:
        catalog.validate_for_consume(
            message_type=envelope.message_type,
            schema_version=envelope.schema_version,
            consumer=consumer,
            payload=envelope.payload.to_wire(),
            correlation_id=str(envelope.correlation_id) if envelope.correlation_id else None,
            causation_id=str(envelope.causation_id) if envelope.causation_id else None,
        )
        # Verify envelope producer is in contract producers
        contract = catalog.get(envelope.message_type, envelope.schema_version)
        if envelope.producer not in contract.producers:
            raise ProducerNotAllowedError(
                f"Envelope producer '{envelope.producer}' is not a valid "
                f"producer for '{envelope.message_type}'"
            )
    except (UnknownContractError, ConsumerNotAllowedError,
            CorrelationPolicyError, CausationPolicyError,
            ContractValidationError):
        raise
