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


@st.composite
def source_references(draw: st.DrawFn) -> SourceReference:
    external_id_int = draw(st.integers(min_value=1, max_value=999999999))
    return SourceReference(
        source_id=draw(st.uuids()),
        provider="vk",
        source_type="community",
        external_id=str(external_id_int),
        owner_id=-external_id_int,
    )


@st.composite
def demands(draw: st.DrawFn) -> tuple[VkSourceDemandRequest, ...]:
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
        result.append(
            VkSourceDemandRequest(
                demand_id=demand_id,
                source=SourceReference(
                    source_id=source_id,
                    provider="vk",
                    source_type="community",
                    external_id=str(external_id_int),
                    owner_id=-external_id_int,
                ),
            )
        )
    return tuple(result)


@st.composite
def vk_execution_requested_payloads(draw: st.DrawFn) -> VkExecutionRequested:
    return VkExecutionRequested(
        task_id=draw(st.integers(min_value=1, max_value=1000000)),
        owner_user_id=draw(st.text(min_size=1, max_size=128)),
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
                alphabet="0123456789abcdef",
                min_size=64,
                max_size=64,
            )
        ),
    )


@st.composite
def enveloped_requests(draw: st.DrawFn) -> MessageEnvelope[VkExecutionRequested]:
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


class TestRoundTrip:
    @given(enveloped_requests())
    def test_serialize_deserialize_identity(
        self, envelope: MessageEnvelope[VkExecutionRequested]
    ) -> None:
        wire = envelope.to_wire()
        restored = MessageEnvelope[VkExecutionRequested].model_validate(wire)
        assert restored == envelope

    @given(vk_execution_requested_payloads())
    def test_payload_round_trip(self, payload: VkExecutionRequested) -> None:
        wire = payload.to_wire()
        restored = VkExecutionRequested.model_validate(wire)
        assert restored == payload


class TestPartitionKeyDeterminism:
    @given(vk_execution_requested_payloads())
    def test_deterministic(self, payload: VkExecutionRequested) -> None:
        key = VK_EXECUTION_REQUESTED.partition_key
        assert key is not None
        assert key.compute(payload) == key.compute(payload)


class TestNestedExtraFields:
    @staticmethod
    def validate_extra(
        envelope: MessageEnvelope[VkExecutionRequested],
        path: tuple[object, ...],
        *,
        extra: str,
    ) -> MessageEnvelope[VkExecutionRequested]:
        wire = envelope.to_wire()
        target = wire
        for segment in path:
            target = target[segment]
        target["futureField"] = extra
        return MessageEnvelope[VkExecutionRequested].model_validate(
            wire,
            extra="forbid" if extra == "reject" else "ignore",
        )

    @given(enveloped_requests())
    @pytest.mark.parametrize(
        "path",
        [
            (),
            ("payload",),
            ("payload", "postSelection"),
            ("payload", "demands", 0),
            ("payload", "demands", 0, "source"),
        ],
    )
    def test_extra_rejected_on_publish(
        self,
        envelope: MessageEnvelope[VkExecutionRequested],
        path: tuple[object, ...],
    ) -> None:
        with pytest.raises(ValidationError):
            self.validate_extra(envelope, path, extra="reject")

    @given(enveloped_requests())
    @pytest.mark.parametrize(
        "path",
        [
            (),
            ("payload",),
            ("payload", "postSelection"),
            ("payload", "demands", 0),
            ("payload", "demands", 0, "source"),
        ],
    )
    def test_extra_ignored_on_consume(
        self,
        envelope: MessageEnvelope[VkExecutionRequested],
        path: tuple[object, ...],
    ) -> None:
        restored = self.validate_extra(envelope, path, extra="ignore")
        assert restored == envelope
