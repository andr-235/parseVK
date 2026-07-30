"""Tests for the new boundary API (prepare_for_publish / parse_for_consume)."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

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
from parsevk_contracts.validation import (
    ParsedMessage,
    PreparedMessage,
    parse_for_consume,
    prepare_for_publish,
)


class SamplePayload(ContractModel):
    entity_id: str
    value: int


class NestedPayload(ContractModel):
    label: str


class OuterPayload(ContractModel):
    inner: NestedPayload


@pytest.fixture
def contract() -> MessageContract:
    return MessageContract(
        message_type="test.event",
        schema_version=1,
        payload_model=SamplePayload,
        topic="test.topic",
        producers=frozenset({"producer-a"}),
        consumers=frozenset({"consumer-b"}),
        partition_key=PartitionKeySpec(paths=("entityId",)),
        correlation_required=True,
        causation_policy="optional",
    )


@pytest.fixture
def catalog(contract: MessageContract) -> ContractCatalog:
    return ContractCatalog.from_contracts((contract,))


def make_prepare_kwargs(**overrides: object) -> dict[str, object]:
    base: dict[str, object] = {
        "message_type": "test.event",
        "schema_version": 1,
        "producer": "producer-a",
        "message_id": uuid4(),
        "occurred_at": datetime.now(UTC),
        "correlation_id": uuid4(),
        "causation_id": None,
        "payload": {"entity_id": "abc", "value": 1},
    }
    base.update(overrides)
    return base


# ── prepare_for_publish tests ─────────────────────────────────────────────


class TestPrepareForPublish:
    def test_returns_typed_envelope(self, catalog: ContractCatalog) -> None:
        result = prepare_for_publish(catalog, **make_prepare_kwargs())  # type: ignore[arg-type]
        assert isinstance(result, PreparedMessage)
        assert result.envelope.message_type == "test.event"

    def test_returns_topic(self, catalog: ContractCatalog) -> None:
        result = prepare_for_publish(catalog, **make_prepare_kwargs())  # type: ignore[arg-type]
        assert result.topic == "test.topic"

    def test_returns_partition_key(self, catalog: ContractCatalog) -> None:
        result = prepare_for_publish(catalog, **make_prepare_kwargs())  # type: ignore[arg-type]
        assert result.partition_key == "abc"

    def test_value_is_json_bytes(self, catalog: ContractCatalog) -> None:
        result = prepare_for_publish(catalog, **make_prepare_kwargs())  # type: ignore[arg-type]
        assert isinstance(result.value, bytes)

    def test_headers_include_content_type(self, catalog: ContractCatalog) -> None:
        result = prepare_for_publish(catalog, **make_prepare_kwargs())  # type: ignore[arg-type]
        header_keys = {k for k, _ in result.headers}
        assert "content_type" in header_keys
        assert "message_type" in header_keys

    def test_unknown_contract(self, catalog: ContractCatalog) -> None:
        kwargs = make_prepare_kwargs(message_type="unknown.event")
        with pytest.raises(UnknownContractError):
            prepare_for_publish(catalog, **kwargs)  # type: ignore[arg-type]

    def test_unauthorized_producer(self, catalog: ContractCatalog) -> None:
        kwargs = make_prepare_kwargs(producer="hacker")
        with pytest.raises(ProducerNotAllowedError):
            prepare_for_publish(catalog, **kwargs)  # type: ignore[arg-type]

    def test_rejects_extra_nested_field(self, catalog: ContractCatalog) -> None:
        payload: dict[str, object] = {"entity_id": "abc", "value": 1, "extraField": "x"}
        kwargs = make_prepare_kwargs(payload=payload)
        with pytest.raises(ContractValidationError):
            prepare_for_publish(catalog, **kwargs)  # type: ignore[arg-type]

    def test_missing_correlation(self, catalog: ContractCatalog) -> None:
        kwargs = make_prepare_kwargs(correlation_id=None)
        with pytest.raises(CorrelationPolicyError):
            prepare_for_publish(catalog, **kwargs)  # type: ignore[arg-type]

    def test_causation_forbidden(self) -> None:
        c = MessageContract(
            message_type="root.cmd",
            schema_version=1,
            payload_model=SamplePayload,
            topic="cmds",
            producers=frozenset({"svc"}),
            consumers=frozenset({"svc"}),
            causation_policy="forbidden",
        )
        cat = ContractCatalog.from_contracts((c,))
        now = datetime.now(UTC)
        kwargs = make_prepare_kwargs(
            message_type="root.cmd",
            producer="svc",
            causation_id=uuid4(),
        )
        kwargs["correlation_id"] = uuid4()
        kwargs["occurred_at"] = now
        with pytest.raises(CausationPolicyError):
            prepare_for_publish(cat, **kwargs)  # type: ignore[arg-type]

    def test_prepare_correlation_mismatch(self) -> None:
        c = MessageContract(
            message_type="test.corr-path",
            schema_version=1,
            payload_model=SamplePayload,
            topic="test.topic",
            producers=frozenset({"svc"}),
            consumers=frozenset({"svc"}),
            correlation_required=True,
            correlation_path="payload.entityId",
        )
        cat = ContractCatalog.from_contracts((c,))
        corr_id = uuid4()
        kwargs = make_prepare_kwargs(
            message_type="test.corr-path",
            producer="svc",
            payload={"entity_id": "abc", "value": 1},
            correlation_id=corr_id,
        )
        kwargs["occurred_at"] = datetime.now(UTC)
        kwargs["message_type"] = "test.corr-path"
        with pytest.raises(CorrelationPolicyError, match="correlationId must match"):
            prepare_for_publish(cat, **kwargs)  # type: ignore[arg-type]

    def test_prepare_with_nested_payload(self) -> None:
        c = MessageContract(
            message_type="nested.event",
            schema_version=1,
            payload_model=OuterPayload,
            topic="nested.topic",
            producers=frozenset({"svc"}),
            consumers=frozenset({"svc"}),
            partition_key=PartitionKeySpec(paths=("inner.label",)),
            correlation_required=False,
        )
        cat = ContractCatalog.from_contracts((c,))
        now = datetime.now(UTC)
        result = prepare_for_publish(
            cat,
            message_type="nested.event",
            schema_version=1,
            producer="svc",
            message_id=uuid4(),
            occurred_at=now,
            payload={"inner": {"label": "deep"}},
        )
        assert result.partition_key == "deep"


# ── parse_for_consume tests ────────────────────────────────────────────────


class TestParseForConsume:
    def test_returns_typed_envelope(self, catalog: ContractCatalog) -> None:
        value = _make_valid_wire_bytes()
        result = parse_for_consume(catalog, consumer="consumer-b", topic="test.topic", value=value)
        assert isinstance(result, ParsedMessage)
        assert result.envelope.message_type == "test.event"

    def test_ignores_additive_fields(self, catalog: ContractCatalog) -> None:
        raw = _make_valid_wire_dict()
        raw["payload"]["extraField"] = "should be ignored"
        value = _json_bytes(raw)
        result = parse_for_consume(catalog, consumer="consumer-b", topic="test.topic", value=value)
        assert isinstance(result, ParsedMessage)

    def test_rejects_invalid_json(self, catalog: ContractCatalog) -> None:
        with pytest.raises(InvalidEnvelopeError):
            parse_for_consume(catalog, consumer="consumer-b", topic="test.topic", value=b"not json")

    def test_rejects_invalid_utf8(self, catalog: ContractCatalog) -> None:
        with pytest.raises(InvalidEnvelopeError):
            parse_for_consume(catalog, consumer="consumer-b", topic="test.topic", value=b"\xff\xfe")

    def test_rejects_json_array(self, catalog: ContractCatalog) -> None:
        with pytest.raises(InvalidEnvelopeError, match="JSON object"):
            parse_for_consume(catalog, consumer="consumer-b", topic="test.topic", value=b"[]")

    def test_rejects_json_null(self, catalog: ContractCatalog) -> None:
        with pytest.raises(InvalidEnvelopeError, match="JSON object"):
            parse_for_consume(catalog, consumer="consumer-b", topic="test.topic", value=b"null")

    def test_rejects_json_string(self, catalog: ContractCatalog) -> None:
        with pytest.raises(InvalidEnvelopeError, match="JSON object"):
            parse_for_consume(catalog, consumer="consumer-b", topic="test.topic", value=b'"hello"')

    def test_unknown_message_type(self, catalog: ContractCatalog) -> None:
        raw = _make_valid_wire_dict()
        raw["messageType"] = "unknown.event"
        with pytest.raises(UnknownContractError):
            parse_for_consume(catalog, consumer="consumer-b", topic="test.topic", value=_json_bytes(raw))

    def test_unknown_schema_version(self, catalog: ContractCatalog) -> None:
        raw = _make_valid_wire_dict()
        raw["schemaVersion"] = 99
        with pytest.raises(UnknownContractError):
            parse_for_consume(catalog, consumer="consumer-b", topic="test.topic", value=_json_bytes(raw))

    def test_unauthorized_consumer(self, catalog: ContractCatalog) -> None:
        value = _make_valid_wire_bytes()
        with pytest.raises(ConsumerNotAllowedError):
            parse_for_consume(catalog, consumer="hacker", topic="test.topic", value=value)

    def test_rejects_invalid_producer(self, catalog: ContractCatalog) -> None:
        raw = _make_valid_wire_dict()
        raw["producer"] = "hacker"
        with pytest.raises(ProducerNotAllowedError):
            parse_for_consume(catalog, consumer="consumer-b", topic="test.topic", value=_json_bytes(raw))

    def test_wrong_topic(self, catalog: ContractCatalog) -> None:
        value = _make_valid_wire_bytes()
        with pytest.raises(TopicMismatchError):
            parse_for_consume(catalog, consumer="consumer-b", topic="wrong.topic", value=value)

    def test_missing_correlation(self) -> None:
        c = MessageContract(
            message_type="test.event",
            schema_version=1,
            payload_model=SamplePayload,
            topic="test.topic",
            producers=frozenset({"producer-a"}),
            consumers=frozenset({"consumer-b"}),
            correlation_required=True,
        )
        cat = ContractCatalog.from_contracts((c,))
        raw = _make_valid_wire_dict()
        raw["correlationId"] = None
        with pytest.raises(CorrelationPolicyError):
            parse_for_consume(cat, consumer="consumer-b", topic="test.topic", value=_json_bytes(raw))

    def test_consume_correlation_mismatch(self) -> None:
        c = MessageContract(
            message_type="test.corr-path",
            schema_version=1,
            payload_model=SamplePayload,
            topic="test.topic",
            producers=frozenset({"producer-a"}),
            consumers=frozenset({"consumer-b"}),
            correlation_required=True,
            correlation_path="payload.entityId",
        )
        cat = ContractCatalog.from_contracts((c,))
        raw = _make_valid_wire_dict(message_type="test.corr-path", producer="producer-a")
        raw["correlationId"] = str(uuid4())
        with pytest.raises(CorrelationPolicyError, match="correlationId must match"):
            parse_for_consume(cat, consumer="consumer-b", topic="test.topic", value=_json_bytes(raw))

    def test_forbidden_causation(self) -> None:
        c = MessageContract(
            message_type="root.cmd",
            schema_version=1,
            payload_model=SamplePayload,
            topic="cmds",
            producers=frozenset({"svc"}),
            consumers=frozenset({"svc"}),
            correlation_required=False,
            causation_policy="forbidden",
        )
        cat = ContractCatalog.from_contracts((c,))
        raw = _make_valid_wire_dict(message_type="root.cmd", producer="svc")
        raw["causationId"] = str(uuid4())
        with pytest.raises(CausationPolicyError):
            parse_for_consume(cat, consumer="svc", topic="cmds", value=_json_bytes(raw))


# ── Helpers ─────────────────────────────────────────────────────────────────


def _make_valid_wire_dict(
    message_type: str = "test.event",
    producer: str = "producer-a",
) -> dict[str, object]:
    return {
        "messageId": str(uuid4()),
        "messageType": message_type,
        "schemaVersion": 1,
        "occurredAt": datetime.now(UTC).isoformat(),
        "producer": producer,
        "correlationId": str(uuid4()),
        "causationId": None,
        "payload": {"entityId": "abc", "value": 1},
    }


def _make_valid_wire_bytes() -> bytes:
    return _json_bytes(_make_valid_wire_dict())


def _json_bytes(data: dict[str, object]) -> bytes:
    import json
    return json.dumps(data).encode("utf-8")


# ── Snake_case and strict mode tests ─────────────────────────────────────────


class TestSnakeCaseRejection:
    """Known Python field names are rejected even with extra='ignore'."""

    @pytest.fixture
    def catalog(self) -> ContractCatalog:
        c = MessageContract(
            message_type="test.event",
            schema_version=1,
            payload_model=SamplePayload,
            topic="test.topic",
            producers=frozenset({"producer-a"}),
            consumers=frozenset({"consumer-b"}),
        )
        return ContractCatalog.from_contracts((c,))

    def test_envelope_snake_message_type(self, catalog: ContractCatalog) -> None:
        raw = _make_valid_wire_dict()
        raw["message_type"] = "test.event"
        with pytest.raises(InvalidEnvelopeError):
            parse_for_consume(catalog, consumer="consumer-b", topic="test.topic", value=_json_bytes(raw))

    def test_envelope_snake_occurred_at(self, catalog: ContractCatalog) -> None:
        raw = _make_valid_wire_dict()
        raw["occurred_at"] = raw["occurredAt"]
        with pytest.raises(InvalidEnvelopeError):
            parse_for_consume(catalog, consumer="consumer-b", topic="test.topic", value=_json_bytes(raw))

    def test_envelope_snake_schema_version(self, catalog: ContractCatalog) -> None:
        raw = _make_valid_wire_dict()
        raw["schema_version"] = raw["schemaVersion"]
        with pytest.raises(InvalidEnvelopeError):
            parse_for_consume(catalog, consumer="consumer-b", topic="test.topic", value=_json_bytes(raw))

    def test_payload_snake_field(self, catalog: ContractCatalog) -> None:
        raw = _make_valid_wire_dict()
        raw["payload"]["entity_id"] = "abc"
        with pytest.raises(ContractValidationError):
            parse_for_consume(catalog, consumer="consumer-b", topic="test.topic", value=_json_bytes(raw))

    def test_duplicate_snake_and_camel(self, catalog: ContractCatalog) -> None:
        raw = _make_valid_wire_dict()
        raw["message_type"] = "other.event"
        with pytest.raises(InvalidEnvelopeError):
            parse_for_consume(catalog, consumer="consumer-b", topic="test.topic", value=_json_bytes(raw))


class TestStrictMode:
    """Strict mode rejects type coercion in JSON wire format."""

    @pytest.fixture
    def catalog(self) -> ContractCatalog:
        c = MessageContract(
            message_type="test.event",
            schema_version=1,
            payload_model=SamplePayload,
            topic="test.topic",
            producers=frozenset({"producer-a"}),
            consumers=frozenset({"consumer-b"}),
        )
        return ContractCatalog.from_contracts((c,))

    def test_consumer_rejects_string_schema_version(self, catalog: ContractCatalog) -> None:
        raw = _make_valid_wire_dict()
        raw["schemaVersion"] = "1"
        with pytest.raises(InvalidEnvelopeError):
            parse_for_consume(catalog, consumer="consumer-b", topic="test.topic", value=_json_bytes(raw))

    def test_consumer_rejects_string_payload_int(self, catalog: ContractCatalog) -> None:
        raw = _make_valid_wire_dict()
        raw["payload"]["value"] = "1"
        with pytest.raises((InvalidEnvelopeError, ContractValidationError)):
            parse_for_consume(catalog, consumer="consumer-b", topic="test.topic", value=_json_bytes(raw))

    def test_producer_rejects_string_value(self) -> None:
        c = MessageContract(
            message_type="strict.test",
            schema_version=1,
            payload_model=SamplePayload,
            topic="test.topic",
            producers=frozenset({"svc"}),
            consumers=frozenset({"svc"}),
        )
        cat = ContractCatalog.from_contracts((c,))
        with pytest.raises(ContractValidationError):
            prepare_for_publish(
                cat,
                message_type="strict.test",
                schema_version=1,
                producer="svc",
                message_id=uuid4(),
                occurred_at=datetime.now(UTC),
                payload={"entity_id": "abc", "value": "1"},
            )

    def test_producer_accepts_correct_types(self) -> None:
        c = MessageContract(
            message_type="strict.test",
            schema_version=1,
            payload_model=SamplePayload,
            topic="test.topic",
            producers=frozenset({"svc"}),
            consumers=frozenset({"svc"}),
        )
        cat = ContractCatalog.from_contracts((c,))
        result = prepare_for_publish(
            cat,
            message_type="strict.test",
            schema_version=1,
            producer="svc",
            message_id=uuid4(),
            occurred_at=datetime.now(UTC),
            payload={"entity_id": "abc", "value": 1},
        )
        assert isinstance(result, PreparedMessage)


class TestSnakeCaseArrayRejection:
    """Snake_case rejection recurses into array elements."""

    class ArrayItem(ContractModel):
        demand_id: str

    class ArrayPayload(ContractModel):
        items: tuple[ArrayItem, ...]

    @pytest.fixture
    def catalog(self) -> ContractCatalog:
        c = MessageContract(
            message_type="test.array",
            schema_version=1,
            payload_model=self.ArrayPayload,
            topic="test.topic",
            producers=frozenset({"svc"}),
            consumers=frozenset({"svc"}),
        )
        return ContractCatalog.from_contracts((c,))

    def test_array_element_snake_field(self, catalog: ContractCatalog) -> None:
        from json import dumps
        raw = {
            "messageId": str(uuid4()),
            "messageType": "test.array",
            "schemaVersion": 1,
            "occurredAt": datetime.now(UTC).isoformat(),
            "producer": "svc",
            "payload": {
                "items": [
                    {"demandId": "abc", "demand_id": "abc"},
                ],
            },
        }
        with pytest.raises(ContractValidationError):
            parse_for_consume(
                catalog, consumer="svc", topic="test.topic",
                value=dumps(raw).encode("utf-8"),
            )
