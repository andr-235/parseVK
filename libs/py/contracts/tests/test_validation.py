"""Tests for unversioned publish and consume boundaries."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from uuid import UUID, uuid4

import pytest

from parsevk_contracts._base import ContractModel
from parsevk_contracts.catalog import ContractCatalog, MessageContract, PartitionKeySpec
from parsevk_contracts.errors import (
    CausationPolicyError,
    ConsumerNotAllowedError,
    ContractValidationError,
    CorrelationPolicyError,
    InvalidEnvelopeError,
    ProducerNotAllowedError,
    TopicMismatchError,
    UnknownContractError,
)
from parsevk_contracts.validation import parse_for_consume, prepare_for_publish


class SamplePayload(ContractModel):
    entity_id: UUID
    value: int


def make_contract(**overrides) -> MessageContract:
    values = {
        "message_type": "test.event",
        "payload_model": SamplePayload,
        "topic": "test.topic",
        "producers": frozenset({"producer-a"}),
        "consumers": frozenset({"consumer-b"}),
        "partition_key": PartitionKeySpec(paths=("entityId",)),
        "correlation_required": True,
        "correlation_path": "payload.entityId",
        "causation_policy": "optional",
    }
    values.update(overrides)
    return MessageContract(**values)


def make_catalog(contract: MessageContract | None = None) -> ContractCatalog:
    return ContractCatalog.from_contracts((contract or make_contract(),))


def prepare(
    catalog: ContractCatalog | None = None,
    *,
    entity_id: UUID | None = None,
    producer: str = "producer-a",
    causation_id: UUID | None = None,
    value: int = 7,
):
    identity = entity_id or uuid4()
    return prepare_for_publish(
        catalog or make_catalog(),
        message_type="test.event",
        producer=producer,
        message_id=uuid4(),
        occurred_at=datetime.now(UTC),
        correlation_id=identity,
        causation_id=causation_id,
        payload={"entity_id": identity, "value": value},
    )


class TestPrepareForPublish:
    def test_returns_typed_unversioned_message(self) -> None:
        identity = uuid4()
        result = prepare(entity_id=identity)
        assert result.topic == "test.topic"
        assert result.partition_key == str(identity)
        assert result.envelope.payload.entity_id == identity
        assert result.headers == (
            ("message_type", b"test.event"),
            ("content_type", b"application/json"),
        )
        wire = json.loads(result.value)
        assert wire["messageType"] == "test.event"
        assert "schemaVersion" not in wire

    def test_unknown_contract_is_rejected(self) -> None:
        with pytest.raises(UnknownContractError):
            prepare_for_publish(
                make_catalog(),
                message_type="unknown.event",
                producer="producer-a",
                message_id=uuid4(),
                occurred_at=datetime.now(UTC),
                payload={"entity_id": uuid4(), "value": 1},
            )

    def test_unauthorized_producer_is_rejected(self) -> None:
        with pytest.raises(ProducerNotAllowedError):
            prepare(producer="intruder")

    def test_strict_payload_types_are_enforced(self) -> None:
        identity = uuid4()
        with pytest.raises(ContractValidationError):
            prepare_for_publish(
                make_catalog(),
                message_type="test.event",
                producer="producer-a",
                message_id=uuid4(),
                occurred_at=datetime.now(UTC),
                correlation_id=identity,
                payload={"entity_id": identity, "value": "7"},
            )

    def test_correlation_must_match_payload_identity(self) -> None:
        with pytest.raises(CorrelationPolicyError):
            prepare_for_publish(
                make_catalog(),
                message_type="test.event",
                producer="producer-a",
                message_id=uuid4(),
                occurred_at=datetime.now(UTC),
                correlation_id=uuid4(),
                payload={"entity_id": uuid4(), "value": 7},
            )

    def test_forbidden_causation_is_rejected(self) -> None:
        catalog = make_catalog(make_contract(causation_policy="forbidden"))
        with pytest.raises(CausationPolicyError):
            prepare(catalog, causation_id=uuid4())


class TestParseForConsume:
    def test_returns_typed_envelope(self) -> None:
        prepared = prepare()
        parsed = parse_for_consume(
            make_catalog(),
            consumer="consumer-b",
            topic=prepared.topic,
            value=prepared.value,
        )
        assert isinstance(parsed.envelope.payload, SamplePayload)
        assert parsed.headers[0] == ("message_type", b"test.event")

    def test_additive_wire_fields_are_ignored(self) -> None:
        prepared = prepare()
        wire = json.loads(prepared.value)
        wire["futureEnvelopeField"] = "ignored"
        wire["payload"]["futurePayloadField"] = "ignored"
        parsed = parse_for_consume(
            make_catalog(),
            consumer="consumer-b",
            topic=prepared.topic,
            value=json.dumps(wire).encode(),
        )
        assert parsed.envelope.payload.value == 7

    @pytest.mark.parametrize("value", [b"{", b"[]", b"null", b'"text"'])
    def test_invalid_envelope_root_is_rejected(self, value: bytes) -> None:
        with pytest.raises(InvalidEnvelopeError):
            parse_for_consume(
                make_catalog(),
                consumer="consumer-b",
                topic="test.topic",
                value=value,
            )

    def test_wrong_topic_and_consumer_are_rejected(self) -> None:
        prepared = prepare()
        with pytest.raises(TopicMismatchError):
            parse_for_consume(
                make_catalog(),
                consumer="consumer-b",
                topic="wrong.topic",
                value=prepared.value,
            )
        with pytest.raises(ConsumerNotAllowedError):
            parse_for_consume(
                make_catalog(),
                consumer="intruder",
                topic=prepared.topic,
                value=prepared.value,
            )

    def test_python_field_names_are_rejected_on_wire(self) -> None:
        prepared = prepare()
        wire = json.loads(prepared.value)
        wire["message_type"] = wire.pop("messageType")
        with pytest.raises(InvalidEnvelopeError):
            parse_for_consume(
                make_catalog(),
                consumer="consumer-b",
                topic=prepared.topic,
                value=json.dumps(wire).encode(),
            )

        wire = json.loads(prepared.value)
        wire["payload"]["entity_id"] = wire["payload"].pop("entityId")
        with pytest.raises(ContractValidationError):
            parse_for_consume(
                make_catalog(),
                consumer="consumer-b",
                topic=prepared.topic,
                value=json.dumps(wire).encode(),
            )
