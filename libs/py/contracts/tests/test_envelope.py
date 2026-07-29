"""Tests for MessageEnvelope."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

import pytest

from parsevk_contracts._base import ContractModel
from parsevk_contracts.envelope import MessageEnvelope


class SamplePayload(ContractModel):
    event: str
    value: int


class TestMessageEnvelope:
    def test_create_envelope(self) -> None:
        """Can create an envelope with a typed payload."""
        now = datetime.now(timezone.utc)
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
        now = datetime.now(timezone.utc)
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
        now = datetime.now(timezone.utc)
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
        now = datetime.now(timezone.utc)
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
        now = datetime.now(timezone.utc)
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
