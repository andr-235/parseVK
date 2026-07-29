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
    # prepared contains envelope, topic, partition_key, value (bytes), headers

    # Consume: caller provides raw bytes from Kafka
    parsed = parse_for_consume(
        catalog,
        consumer="vk-service",
        topic="parsevk.vk.commands",
        value=b'{...}',
    )
    # parsed contains typed envelope and headers
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from pydantic import ValidationError

from ._base import ContractModel
from .catalog import ContractCatalog, MessageContract, _resolve_wire_path
from .envelope import MessageEnvelope
from .errors import (
    CausationPolicyError,
    ConsumerNotAllowedError,
    ContractValidationError,
    CorrelationPolicyError,
    InvalidEnvelopeError,
    ProducerNotAllowedError,
    TopicMismatchError,
)


@dataclass(frozen=True, slots=True)
class PreparedMessage:
    """Result of prepare_for_publish — ready for Kafka producer."""

    envelope: MessageEnvelope[ContractModel]
    topic: str
    partition_key: str | None
    value: bytes
    headers: tuple[tuple[str, bytes], ...]


@dataclass(frozen=True, slots=True)
class ParsedMessage:
    """Result of parse_for_consume — validated message from Kafka."""

    envelope: MessageEnvelope[ContractModel]
    headers: tuple[tuple[str, bytes], ...]


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
    5. Returns PreparedMessage with envelope, topic, partition_key, value, headers
    """
    contract = catalog.get(message_type, schema_version)

    if producer not in contract.producers:
        raise ProducerNotAllowedError(
            f"Service '{producer}' is not allowed to publish '{message_type}'"
        )

    try:
        payload_model = contract.payload_model.model_validate(payload, extra="forbid")
    except ValidationError as exc:
        raise ContractValidationError(
            f"Payload validation failed for '{message_type}': {exc}"
        ) from exc

    envelope: MessageEnvelope[ContractModel] = MessageEnvelope(
        message_id=message_id,
        message_type=message_type,
        schema_version=schema_version,
        occurred_at=occurred_at,
        producer=producer,
        correlation_id=correlation_id,
        causation_id=causation_id,
        payload=payload_model,
    )

    _enforce_envelope_policy(contract, envelope)

    partition_key = (
        contract.partition_key.compute(payload_model)
        if contract.partition_key
        else None
    )

    value = envelope.to_wire_json().encode("utf-8")
    headers: tuple[tuple[str, bytes], ...] = (
        ("message_type", message_type.encode("utf-8")),
        ("schema_version", str(schema_version).encode("utf-8")),
        ("content_type", b"application/json"),
    )

    return PreparedMessage(
        envelope=envelope,
        topic=contract.topic,
        partition_key=partition_key,
        value=value,
        headers=headers,
    )


def parse_for_consume(
    catalog: ContractCatalog,
    *,
    consumer: str,
    topic: str,
    value: bytes,
) -> ParsedMessage:
    """Parse and validate a received Kafka message.

    1. JSON-decodes the bytes
    2. Extracts header fields (message_type, schema_version, producer)
    3. Looks up contract
    4. Verifies topic matches
    5. Validates consumer is allowed
    6. Builds typed envelope with extra="ignore" (tolerant consumer)
    7. Enforces envelope policy (correlation, causation)
    8. Returns ParsedMessage with typed envelope
    """
    try:
        raw = json.loads(value)
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise InvalidEnvelopeError(f"Invalid JSON: {exc}") from exc

    if not isinstance(raw, dict):
        raise InvalidEnvelopeError("Envelope root must be a JSON object")

    try:
        envelope_raw = MessageEnvelope[ContractModel].model_validate(
            raw, extra="ignore", by_alias=True, by_name=False
        )
    except ValidationError as exc:
        raise InvalidEnvelopeError(f"Invalid envelope: {exc}") from exc

    message_type = envelope_raw.message_type
    schema_version = envelope_raw.schema_version
    contract = catalog.get(message_type, schema_version)

    if topic != contract.topic:
        raise TopicMismatchError(
            f"Expected topic '{contract.topic}' for '{message_type}', "
            f"got '{topic}'"
        )

    if consumer not in contract.consumers:
        raise ConsumerNotAllowedError(
            f"Service '{consumer}' is not allowed to consume '{message_type}'"
        )

    if envelope_raw.producer not in contract.producers:
        raise ProducerNotAllowedError(
            f"Envelope producer '{envelope_raw.producer}' is not allowed "
            f"to publish '{message_type}'"
        )

    payload_raw: dict[str, object] = {}
    if isinstance(raw.get("payload"), dict):
        payload_raw = raw["payload"]

    try:
        typed_payload = contract.payload_model.model_validate(
            payload_raw, extra="ignore", by_alias=True, by_name=False
        )
    except ValidationError as exc:
        raise ContractValidationError(
            f"Payload validation failed for '{message_type}': {exc}"
        ) from exc

    envelope: MessageEnvelope[ContractModel] = MessageEnvelope(
        message_id=envelope_raw.message_id,
        message_type=message_type,
        schema_version=schema_version,
        occurred_at=envelope_raw.occurred_at,
        producer=envelope_raw.producer,
        correlation_id=envelope_raw.correlation_id,
        causation_id=envelope_raw.causation_id,
        payload=typed_payload,
    )

    _enforce_envelope_policy(contract, envelope)

    headers: tuple[tuple[str, bytes], ...] = (
        ("message_type", message_type.encode("utf-8")),
        ("schema_version", str(schema_version).encode("utf-8")),
        ("content_type", b"application/json"),
    )

    return ParsedMessage(envelope=envelope, headers=headers)


def _enforce_envelope_policy(
    contract: MessageContract,
    envelope: MessageEnvelope[ContractModel],
) -> None:
    """Enforce correlation and causation policy for an envelope."""
    if contract.correlation_required and envelope.correlation_id is None:
        raise CorrelationPolicyError(
            f"correlationId is required for '{contract.message_type}'"
        )

    if contract.correlation_path is not None and envelope.correlation_id is not None:
        wire = envelope.to_wire()
        expected_raw = _resolve_wire_path(wire, contract.correlation_path)
        expected_str = str(expected_raw) if expected_raw is not None else ""
        if str(envelope.correlation_id) != expected_str:
            raise CorrelationPolicyError(
                f"correlationId must match '{contract.correlation_path}': "
                f"got {envelope.correlation_id}, expected {expected_raw}"
            )

    if contract.causation_policy == "required" and envelope.causation_id is None:
        raise CausationPolicyError(
            f"causationId is required for '{contract.message_type}'"
        )
    if contract.causation_policy == "forbidden" and envelope.causation_id is not None:
        raise CausationPolicyError(
            f"causationId is forbidden for '{contract.message_type}'"
        )
