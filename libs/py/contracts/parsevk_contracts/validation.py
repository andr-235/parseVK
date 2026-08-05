"""Publish and consume unversioned Kafka contracts."""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from pydantic import ValidationError

from ._base import ContractModel
from ._validation_helpers import (
    enforce_envelope_policy,
    envelope_type,
    reject_python_field_names,
)
from .catalog import ContractCatalog
from .envelope import EnvelopeHeader, MessageEnvelope
from .errors import (
    ConsumerNotAllowedError,
    ContractValidationError,
    InvalidEnvelopeError,
    ProducerNotAllowedError,
    TopicMismatchError,
)


@dataclass(frozen=True, slots=True)
class PreparedMessage:
    envelope: MessageEnvelope[ContractModel]
    topic: str
    partition_key: str | None
    value: bytes
    headers: tuple[tuple[str, bytes], ...]


@dataclass(frozen=True, slots=True)
class ParsedMessage:
    envelope: MessageEnvelope[ContractModel]
    headers: tuple[tuple[str, bytes], ...]


def prepare_for_publish(
    catalog: ContractCatalog,
    *,
    message_type: str,
    producer: str,
    message_id: UUID,
    occurred_at: datetime,
    correlation_id: UUID | None = None,
    causation_id: UUID | None = None,
    payload: dict[str, object],
) -> PreparedMessage:
    try:
        header = EnvelopeHeader.model_validate(
            {"message_type": message_type},
            strict=True,
            extra="forbid",
            by_alias=False,
            by_name=True,
        )
    except ValidationError as exc:
        raise ContractValidationError(f"Invalid envelope header: {exc}") from exc
    contract = catalog.get(header.message_type)
    try:
        payload_model = contract.payload_model.model_validate(
            payload,
            strict=True,
            extra="forbid",
            by_alias=False,
            by_name=True,
        )
        envelope = envelope_type(contract.payload_model).model_validate(
            {
                "message_id": message_id,
                "message_type": message_type,
                "occurred_at": occurred_at,
                "producer": producer,
                "correlation_id": correlation_id,
                "causation_id": causation_id,
                "payload": payload_model,
            },
            strict=True,
            extra="forbid",
            by_alias=False,
            by_name=True,
        )
    except ValidationError as exc:
        raise ContractValidationError(
            f"Validation failed for '{message_type}': {exc}"
        ) from exc
    if producer not in contract.producers:
        raise ProducerNotAllowedError(
            f"Producer '{producer}' cannot publish '{message_type}'"
        )
    enforce_envelope_policy(contract, envelope)
    key = contract.partition_key.compute(payload_model) if contract.partition_key else None
    headers = (
        ("message_type", message_type.encode()),
        ("content_type", b"application/json"),
    )
    return PreparedMessage(
        envelope=envelope,
        topic=contract.topic,
        partition_key=key,
        value=envelope.to_wire_json().encode(),
        headers=headers,
    )


def parse_for_consume(
    catalog: ContractCatalog,
    *,
    consumer: str,
    topic: str,
    value: bytes,
) -> ParsedMessage:
    try:
        raw = json.loads(value)
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise InvalidEnvelopeError(f"Invalid JSON: {exc}") from exc
    if not isinstance(raw, dict):
        raise InvalidEnvelopeError("Envelope root must be a JSON object")
    try:
        header = EnvelopeHeader.model_validate(
            raw,
            strict=True,
            extra="ignore",
            by_alias=True,
            by_name=False,
        )
    except ValidationError as exc:
        raise InvalidEnvelopeError(f"Invalid envelope header: {exc}") from exc
    contract = catalog.get(header.message_type)
    if topic != contract.topic:
        raise TopicMismatchError(
            f"Expected topic '{contract.topic}', got '{topic}'"
        )
    if consumer not in contract.consumers:
        raise ConsumerNotAllowedError(
            f"Consumer '{consumer}' cannot consume '{header.message_type}'"
        )
    typed_envelope = envelope_type(contract.payload_model)
    reject_python_field_names(
        raw,
        typed_envelope,
        InvalidEnvelopeError,
        {"payload"},
    )
    payload_raw = raw.get("payload")
    if isinstance(payload_raw, dict):
        reject_python_field_names(
            payload_raw,
            contract.payload_model,
            ContractValidationError,
        )
    try:
        envelope = typed_envelope.model_validate_json(
            value,
            strict=True,
            extra="ignore",
            by_alias=True,
            by_name=False,
        )
    except ValidationError as exc:
        raise ContractValidationError(
            f"Validation failed for '{header.message_type}': {exc}"
        ) from exc
    if envelope.producer not in contract.producers:
        raise ProducerNotAllowedError(
            f"Producer '{envelope.producer}' cannot publish '{header.message_type}'"
        )
    enforce_envelope_policy(contract, envelope)
    return ParsedMessage(
        envelope=envelope,
        headers=(
            ("message_type", header.message_type.encode()),
            ("content_type", b"application/json"),
        ),
    )
