"""Property-based tests for contract models using Hypothesis."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

import pytest
from hypothesis import assume, given
from hypothesis import strategies as st
from pydantic import ValidationError

from parsevk_contracts.envelope import MessageEnvelope
from parsevk_contracts.vk.commands import (
    VK_EXECUTION_REQUESTED,
    CommentSelection,
    PostSelection,
    SourceReference,
    VkExecutionRequested,
    VkSourceDemandRequest,
)

# ── Hypothesis strategies ─────────────────────────────────────────────────────


@st.composite
def source_references(draw: st.DrawFn) -> SourceReference:
    """Generate valid SourceReference instances."""
    external_id_int = draw(st.integers(min_value=1, max_value=999999999))
    external_id = str(external_id_int)
    return SourceReference(
        source_id=draw(st.uuids()),
        provider="vk",
        source_type="community",
        external_id=external_id,
        owner_id=-external_id_int,
    )


@st.composite
def demands(draw: st.DrawFn) -> tuple[VkSourceDemandRequest, ...]:
    """Generate a non-empty tuple of VkSourceDemandRequest with unique IDs."""
    n = draw(st.integers(min_value=1, max_value=5))
    demand_ids: list[UUID] = []
    source_ids: list[UUID] = []
    result: list[VkSourceDemandRequest] = []

    for _ in range(n):
        demand_id = draw(st.uuids())
        source_id = draw(st.uuids())
        assume(demand_id not in demand_ids)
        assume(source_id not in source_ids)
        demand_ids.append(demand_id)
        source_ids.append(source_id)

        external_id_int = draw(st.integers(min_value=1, max_value=999999999))
        ref = SourceReference(
            source_id=source_id,
            provider="vk",
            source_type="community",
            external_id=str(external_id_int),
            owner_id=-external_id_int,
        )

        result.append(
            VkSourceDemandRequest(
                demand_id=demand_id,
                source=ref,
            )
        )

    return tuple(result)


@st.composite
def vk_execution_requested_payloads(draw: st.DrawFn) -> VkExecutionRequested:
    """Generate valid VkExecutionRequested instances."""
    return VkExecutionRequested(
        task_id=draw(st.integers(min_value=1, max_value=1000000)),
        task_run_id=draw(st.uuids()),
        execution_id=draw(st.uuids()),
        demands=draw(demands()),
        post_selection=PostSelection(
            strategy="latestByPublishedAt",
            limit_per_source=draw(st.integers(min_value=1, max_value=100)),
        ),
        comment_selection=CommentSelection(
            mode="all",
            include_thread_replies=True,
        ),
        task_revision=draw(st.integers(min_value=1, max_value=100)),
        source_set_revision=draw(st.integers(min_value=1, max_value=100)),
        snapshot_sha256=draw(
            st.text(
                alphabet=st.characters(min_codepoint=48, max_codepoint=102,
                                       whitelist_categories=("Nd", "Ll")),
                min_size=64,
                max_size=64,
            ).filter(lambda s: all(c in "0123456789abcdef" for c in s))
        ),
    )


@st.composite
def enveloped_requests(draw: st.DrawFn) -> MessageEnvelope[VkExecutionRequested]:
    """Generate a full MessageEnvelope with VkExecutionRequested payload."""
    payload = draw(vk_execution_requested_payloads())
    return MessageEnvelope[VkExecutionRequested](
        message_id=draw(st.uuids()),
        message_type="vk.execution.requested",
        schema_version=1,
        occurred_at=datetime.now(UTC),
        producer="tasks-service",
        correlation_id=payload.execution_id,
        payload=payload,
    )


# ── Tests ─────────────────────────────────────────────────────────────────────


class TestRoundTrip:
    @given(enveloped_requests())
    def test_serialize_deserialize_identity(
        self, envelope: MessageEnvelope[VkExecutionRequested]
    ) -> None:
        """Serializing and deserializing produces identical data."""
        wire = envelope.to_wire()
        restored = MessageEnvelope[VkExecutionRequested].model_validate(wire)
        assert restored == envelope

    @given(vk_execution_requested_payloads())
    def test_payload_round_trip(self, payload: VkExecutionRequested) -> None:
        """Payload serialization round-trip preserves all fields."""
        wire = payload.to_wire()
        restored = VkExecutionRequested.model_validate(wire)
        assert restored == payload


class TestPartitionKeyDeterminism:
    @given(vk_execution_requested_payloads())
    def test_deterministic(self, payload: VkExecutionRequested) -> None:
        """Same payload always produces same partition key."""
        key = VK_EXECUTION_REQUESTED.partition_key
        assert key is not None
        assert key.compute(payload) == key.compute(payload)


class TestNestedExtraFields:
    """Matrix test: unknown fields at 5 nesting levels."""

    @given(enveloped_requests())
    def test_envelope_level_extra_rejected_on_publish(
        self, envelope: MessageEnvelope[VkExecutionRequested]
    ) -> None:
        """Extra field at envelope level is rejected on publish."""
        wire = envelope.to_wire()
        wire["futureField"] = "reject"
        with pytest.raises(ValidationError):
            MessageEnvelope[VkExecutionRequested].model_validate(wire, extra="forbid")

    @given(enveloped_requests())
    def test_envelope_level_extra_ignored_on_consume(
        self, envelope: MessageEnvelope[VkExecutionRequested]
    ) -> None:
        """Extra field at envelope level is ignored on consume."""
        wire = envelope.to_wire()
        wire["futureField"] = "ignore"
        restored = MessageEnvelope[VkExecutionRequested].model_validate(
            wire, extra="ignore"
        )
        assert restored == envelope

    @given(enveloped_requests())
    def test_payload_level_extra_rejected_on_publish(
        self, envelope: MessageEnvelope[VkExecutionRequested]
    ) -> None:
        """Extra field at payload level is rejected on publish."""
        wire = envelope.to_wire()
        wire["payload"]["futureField"] = "reject"
        with pytest.raises(ValidationError):
            MessageEnvelope[VkExecutionRequested].model_validate(wire, extra="forbid")

    @given(enveloped_requests())
    def test_payload_level_extra_ignored_on_consume(
        self, envelope: MessageEnvelope[VkExecutionRequested]
    ) -> None:
        """Extra field at payload level is ignored on consume."""
        wire = envelope.to_wire()
        wire["payload"]["futureField"] = "ignore"
        restored = MessageEnvelope[VkExecutionRequested].model_validate(
            wire, extra="ignore"
        )
        assert restored == envelope

    @given(enveloped_requests())
    def test_post_selection_extra_rejected_on_publish(
        self, envelope: MessageEnvelope[VkExecutionRequested]
    ) -> None:
        """Extra field in postSelection is rejected on publish."""
        wire = envelope.to_wire()
        wire["payload"]["postSelection"]["futureField"] = "reject"
        with pytest.raises(ValidationError):
            MessageEnvelope[VkExecutionRequested].model_validate(wire, extra="forbid")

    @given(enveloped_requests())
    def test_post_selection_extra_ignored_on_consume(
        self, envelope: MessageEnvelope[VkExecutionRequested]
    ) -> None:
        """Extra field in postSelection is ignored on consume."""
        wire = envelope.to_wire()
        wire["payload"]["postSelection"]["futureField"] = "ignore"
        restored = MessageEnvelope[VkExecutionRequested].model_validate(
            wire, extra="ignore"
        )
        assert restored == envelope

    @given(enveloped_requests())
    def test_demand_level_extra_rejected_on_publish(
        self, envelope: MessageEnvelope[VkExecutionRequested]
    ) -> None:
        """Extra field in demands[0] is rejected on publish."""
        wire = envelope.to_wire()
        wire["payload"]["demands"][0]["futureField"] = "reject"
        with pytest.raises(ValidationError):
            MessageEnvelope[VkExecutionRequested].model_validate(wire, extra="forbid")

    @given(enveloped_requests())
    def test_demand_level_extra_ignored_on_consume(
        self, envelope: MessageEnvelope[VkExecutionRequested]
    ) -> None:
        """Extra field in demands[0] is ignored on consume."""
        wire = envelope.to_wire()
        wire["payload"]["demands"][0]["futureField"] = "ignore"
        restored = MessageEnvelope[VkExecutionRequested].model_validate(
            wire, extra="ignore"
        )
        assert restored == envelope

    @given(enveloped_requests())
    def test_source_level_extra_rejected_on_publish(
        self, envelope: MessageEnvelope[VkExecutionRequested]
    ) -> None:
        """Extra field in demands[0].source is rejected on publish."""
        wire = envelope.to_wire()
        wire["payload"]["demands"][0]["source"]["futureField"] = "reject"
        with pytest.raises(ValidationError):
            MessageEnvelope[VkExecutionRequested].model_validate(wire, extra="forbid")

    @given(enveloped_requests())
    def test_source_level_extra_ignored_on_consume(
        self, envelope: MessageEnvelope[VkExecutionRequested]
    ) -> None:
        """Extra field in demands[0].source is ignored on consume."""
        wire = envelope.to_wire()
        wire["payload"]["demands"][0]["source"]["futureField"] = "ignore"
        restored = MessageEnvelope[VkExecutionRequested].model_validate(
            wire, extra="ignore"
        )
        assert restored == envelope
