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

    # Consume: caller provides raw bytes from Kafka
    parsed = parse_for_consume(
        catalog,
        consumer="vk-service",
        topic="parsevk.vk.commands",
        value=b'{...}',
    )
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime
from types import UnionType
from typing import Union, get_args, get_origin
from uuid import UUID

from pydantic import ValidationError

from ._base import ContractModel
from .catalog import ContractCatalog, MessageContract, _resolve_wire_path
from .envelope import EnvelopeHeader, MessageEnvelope
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


def _resolve_contract_model(ann: object) -> type[ContractModel] | None:
    """Extract a ContractModel subclass from a type annotation if possible."""
    if ann is None:
        return None
    if isinstance(ann, type) and issubclass(ann, ContractModel) and ann is not ContractModel:
        return ann
    origin = get_origin(ann)
    args = get_args(ann)
    if origin in (Union, UnionType):
        for arg in args:
            if isinstance(arg, type) and issubclass(arg, ContractModel) and arg is not ContractModel:
                return arg
    if origin is tuple:
        for arg in args:
            if arg is not Ellipsis:
                if isinstance(arg, type) and issubclass(arg, ContractModel) and arg is not ContractModel:
                    return arg
    return None


def _reject_known_python_field_names(
    raw: dict[str, object],
    model: type[ContractModel],
    error_type: type[Exception],
    skip_recursion: set[str] | None = None,
) -> None:
    """Reject known Python field names that differ from their camelCase alias.

    A field like ``value`` whose Python name equals its alias is left alone.
    Only fields with a distinct Python name (e.g. ``message_type`` vs
    ``messageType``) are rejected when they appear in the raw dict.
    Recurses into nested dicts using the camelCase alias as lookup key,
    unless the alias is in *skip_recursion*.
    """
    skip_recursion = skip_recursion or set()
    for field_name, field_info in model.model_fields.items():
        alias = field_info.alias or field_name
        if field_name != alias and field_name in raw:
            raise error_type(
                f"Field '{field_name}' is a Python-internal name; "
                f"use camelCase alias '{alias}' instead"
            )
        if alias not in skip_recursion:
            nested_value = raw.get(alias)
            if isinstance(nested_value, dict):
                nested_model = _resolve_contract_model(field_info.annotation)
                if nested_model is not None:
                    _reject_known_python_field_names(nested_value, nested_model, error_type, skip_recursion)
            elif isinstance(nested_value, (list, tuple)):
                nested_model = _resolve_contract_model(field_info.annotation)
                if nested_model is not None:
                    for item in nested_value:
                        if isinstance(item, dict):
                            _reject_known_python_field_names(item, nested_model, error_type, skip_recursion)


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
    3. Validates payload with strict=True + extra="forbid"
    4. Builds the typed envelope
    5. Returns PreparedMessage with envelope, topic, partition_key, value, headers
    """
    contract = catalog.get(message_type, schema_version)

    if producer not in contract.producers:
        raise ProducerNotAllowedError(
            f"Service '{producer}' is not allowed to publish '{message_type}'"
        )

    try:
        payload_model = contract.payload_model.model_validate(
            payload, strict=True, extra="forbid",
            by_alias=False, by_name=True,
        )
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

    1. JSON-decodes the bytes for header extraction
    2. Validates envelope header with strict=True + extra="forbid"
    3. Looks up contract
    4. Rejects known Python field names in envelope and payload
    5. Validates full typed message with model_validate_json(strict=True)
    6. Enforces envelope policy (correlation, causation)
    7. Returns ParsedMessage with typed envelope
    """
    try:
        raw = json.loads(value)
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise InvalidEnvelopeError(f"Invalid JSON: {exc}") from exc

    if not isinstance(raw, dict):
        raise InvalidEnvelopeError("Envelope root must be a JSON object")

    try:
        header = EnvelopeHeader.model_validate(
            raw, strict=True, extra="ignore", by_alias=True, by_name=False,
        )
    except ValidationError as exc:
        raise InvalidEnvelopeError(f"Invalid envelope header: {exc}") from exc

    message_type = header.message_type
    schema_version = header.schema_version
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

    envelope_type: type[MessageEnvelope[ContractModel]] = MessageEnvelope[
        contract.payload_model  # type: ignore[name-defined]
    ]

    _reject_known_python_field_names(raw, envelope_type, InvalidEnvelopeError, skip_recursion={"payload"})

    payload_raw: dict[str, object] = {}
    if isinstance(raw.get("payload"), dict):
        payload_raw = raw["payload"]
        _reject_known_python_field_names(
            payload_raw, contract.payload_model, ContractValidationError,
        )

    try:
        envelope = envelope_type.model_validate_json(
            value, strict=True, extra="ignore", by_alias=True, by_name=False,
        )
    except ValidationError as exc:
        errors = exc.errors()
        has_payload_error = any(
            bool(e.get("loc")) and e["loc"][0] == "payload"
            for e in errors
        )
        has_envelope_error = any(
            bool(e.get("loc")) and e["loc"][0] != "payload"
            for e in errors
        )
        if has_payload_error and not has_envelope_error:
            raise ContractValidationError(
                f"Payload validation failed for '{message_type}': {exc}"
            ) from exc
        raise InvalidEnvelopeError(f"Invalid envelope: {exc}") from exc

    if envelope.producer not in contract.producers:
        raise ProducerNotAllowedError(
            f"Envelope producer '{envelope.producer}' is not allowed "
            f"to publish '{message_type}'"
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
