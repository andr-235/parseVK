"""Tests for the unversioned message envelope."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta, timezone
from uuid import uuid4

import pytest
from pydantic import ValidationError

from parsevk_contracts._base import ContractModel
from parsevk_contracts.envelope import MessageEnvelope


class SamplePayload(ContractModel):
    event: str
    value: int


def make_envelope(**overrides) -> MessageEnvelope[SamplePayload]:
    values = {
        "message_id": uuid4(),
        "message_type": "test.event",
        "occurred_at": datetime.now(UTC),
        "producer": "test-service",
        "payload": SamplePayload(event="test", value=42),
    }
    values.update(overrides)
    return MessageEnvelope[SamplePayload](**values)


class TestMessageEnvelope:
    def test_create_envelope(self) -> None:
        envelope = make_envelope()
        assert envelope.message_type == "test.event"
        assert envelope.payload.event == "test"
        assert envelope.payload.value == 42
        assert not hasattr(envelope, "schema_version")

    def test_envelope_with_correlation(self) -> None:
        correlation_id = uuid4()
        causation_id = uuid4()
        envelope = make_envelope(
            correlation_id=correlation_id,
            causation_id=causation_id,
        )
        assert envelope.correlation_id == correlation_id
        assert envelope.causation_id == causation_id

    def test_envelope_round_trip_uses_camel_case(self) -> None:
        wire = make_envelope().to_wire()
        assert "messageId" in wire
        assert "messageType" in wire
        assert "occurredAt" in wire
        assert "correlationId" in wire
        assert "causationId" in wire
        assert "schemaVersion" not in wire

    def test_envelope_frozen(self) -> None:
        envelope = make_envelope()
        with pytest.raises(ValueError, match="frozen"):
            envelope.message_type = "changed"  # type: ignore[misc]

    def test_optional_links_default_to_none(self) -> None:
        envelope = make_envelope()
        assert envelope.correlation_id is None
        assert envelope.causation_id is None

    def test_naive_datetime_rejected(self) -> None:
        with pytest.raises(ValidationError):
            make_envelope(occurred_at=datetime(2026, 1, 1, 12, 0, 0))

    def test_non_utc_datetime_is_normalized(self) -> None:
        offset = timezone(timedelta(hours=10))
        occurred_at = datetime(2026, 1, 1, 12, 0, 0, tzinfo=offset)
        envelope = make_envelope(occurred_at=occurred_at)
        assert envelope.occurred_at.tzinfo is UTC
        assert envelope.occurred_at.hour == 2

    def test_wire_json_zulu_is_normalized(self) -> None:
        raw = (
            '{"messageId":"00000000-0000-0000-0000-000000000001",'
            '"messageType":"test.wire",'
            '"occurredAt":"2026-01-01T12:00:00Z",'
            '"producer":"svc",'
            '"payload":{"event":"zulu","value":0}}'
        )
        restored = MessageEnvelope[SamplePayload].model_validate_json(raw, strict=True)
        assert restored.occurred_at.tzinfo is UTC

    def test_schema_version_is_rejected_as_extra_input(self) -> None:
        with pytest.raises(ValidationError):
            MessageEnvelope[SamplePayload](
                message_id=uuid4(),
                message_type="test.event",
                occurred_at=datetime.now(UTC),
                producer="svc",
                payload=SamplePayload(event="test", value=1),
                schema_version=1,  # type: ignore[call-arg]
            )
