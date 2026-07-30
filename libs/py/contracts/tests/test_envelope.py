"""Tests for MessageEnvelope."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta, timezone
from uuid import uuid4

import pytest
from parsevk_contracts._base import ContractModel
from parsevk_contracts.envelope import MessageEnvelope
from pydantic import ValidationError


class SamplePayload(ContractModel):
    event: str
    value: int


class TestMessageEnvelope:
    def test_create_envelope(self) -> None:
        """Can create an envelope with a typed payload."""
        now = datetime.now(UTC)
        payload = SamplePayload(event="test", value=42)
        envelope = MessageEnvelope[SamplePayload](
            message_id=uuid4(),
            message_type="test.event",
            schema_version=1,
            occurred_at=now,
            producer="test-service",
            payload=payload,
        )
        assert envelope.message_type == "test.event"
        assert envelope.payload.event == "test"
        assert envelope.payload.value == 42

    def test_envelope_with_correlation(self) -> None:
        """Envelope supports optional correlation_id and causation_id."""
        now = datetime.now(UTC)
        corr_id = uuid4()
        causa_id = uuid4()
        payload = SamplePayload(event="chain", value=1)
        envelope = MessageEnvelope[SamplePayload](
            message_id=uuid4(),
            message_type="test.chain",
            schema_version=1,
            occurred_at=now,
            producer="svc",
            correlation_id=corr_id,
            causation_id=causa_id,
            payload=payload,
        )
        assert envelope.correlation_id == corr_id
        assert envelope.causation_id == causa_id

    def test_envelope_round_trip(self) -> None:
        """Envelope serialization round-trip preserves all fields."""
        now = datetime.now(UTC)
        payload = SamplePayload(event="roundtrip", value=99)
        envelope = MessageEnvelope[SamplePayload](
            message_id=uuid4(),
            message_type="test.roundtrip",
            schema_version=1,
            occurred_at=now,
            producer="svc",
            payload=payload,
        )
        wire = envelope.to_wire()
        # Verify camelCase keys
        assert "messageId" in wire
        assert "messageType" in wire
        assert "schemaVersion" in wire
        assert "occurredAt" in wire
        assert "correlationId" in wire
        assert "causationId" in wire

    def test_envelope_frozen(self) -> None:
        """Envelope is immutable after construction."""
        now = datetime.now(UTC)
        payload = SamplePayload(event="frozen", value=0)
        envelope = MessageEnvelope[SamplePayload](
            message_id=uuid4(),
            message_type="test.frozen",
            schema_version=1,
            occurred_at=now,
            producer="svc",
            payload=payload,
        )
        with pytest.raises(ValueError, match="frozen"):
            envelope.message_type = "changed"  # type: ignore[misc]

    def test_envelope_correlation_default_none(self) -> None:
        """correlation_id and causation_id default to None."""
        now = datetime.now(UTC)
        payload = SamplePayload(event="defaults", value=0)
        envelope = MessageEnvelope[SamplePayload](
            message_id=uuid4(),
            message_type="test.defaults",
            schema_version=1,
            occurred_at=now,
            producer="svc",
            payload=payload,
        )
        assert envelope.correlation_id is None
        assert envelope.causation_id is None

    def test_naive_datetime_rejected(self) -> None:
        """Naive datetime (no timezone) raises ValidationError."""
        payload = SamplePayload(event="naive", value=0)
        with pytest.raises(ValidationError):
            MessageEnvelope[SamplePayload](
                message_id=uuid4(),
                message_type="test.naive",
                schema_version=1,
                occurred_at=datetime(2026, 1, 1, 12, 0, 0),
                producer="svc",
                payload=payload,
            )

    def test_non_utc_normalized(self) -> None:
        """Datetime with +10:00 offset is normalized to UTC."""
        payload = SamplePayload(event="tz", value=0)
        tz_plus_10 = timezone(timedelta(hours=10))
        occurred = datetime(2026, 1, 1, 12, 0, 0, tzinfo=tz_plus_10)
        envelope = MessageEnvelope[SamplePayload](
            message_id=uuid4(),
            message_type="test.tz",
            schema_version=1,
            occurred_at=occurred,
            producer="svc",
            payload=payload,
        )
        assert envelope.occurred_at.tzinfo is UTC
        assert envelope.occurred_at.hour == 2  # 12:00 +10:00 → 02:00 UTC

    def test_wire_json_zulu(self) -> None:
        """Wire JSON with Z offset is parsed and normalized to UTC."""
        raw = (
            '{"messageId":"00000000-0000-0000-0000-000000000001",'
            '"messageType":"test.wire",'
            '"schemaVersion":1,'
            '"occurredAt":"2026-01-01T12:00:00Z",'
            '"producer":"svc",'
            '"payload":{"event":"zulu","value":0}}'
        )
        restored = MessageEnvelope[SamplePayload].model_validate_json(
            raw, strict=True,
        )
        assert restored.occurred_at.tzinfo is UTC
