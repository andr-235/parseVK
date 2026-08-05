"""Property-based tests for canonical VK command contracts."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Literal
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
def demands(draw: st.DrawFn) -> tuple[VkSourceDemandRequest, ...]:
    count = draw(st.integers(min_value=1, max_value=5))
    demand_ids: set[UUID] = set()
    source_ids: set[UUID] = set()
    result: list[VkSourceDemandRequest] = []
    for _ in range(count):
        demand_id = draw(st.uuids())
        source_id = draw(st.uuids())
        assume(demand_id not in demand_ids)
        assume(source_id not in source_ids)
        demand_ids.add(demand_id)
        source_ids.add(source_id)
        external_id = draw(st.integers(min_value=1, max_value=999999999))
        result.append(
            VkSourceDemandRequest(
                demand_id=demand_id,
                source=SourceReference(
                    source_id=source_id,
                    provider="vk",
                    source_type="community",
                    external_id=str(external_id),
                    owner_id=-external_id,
                ),
            )
        )
    return tuple(result)


@st.composite
def requested_payloads(draw: st.DrawFn) -> VkExecutionRequested:
    return VkExecutionRequested(
        task_id=draw(st.integers(min_value=1, max_value=1_000_000)),
        owner_user_id=draw(
            st.text(
                alphabet=st.characters(whitelist_categories=("L", "N")),
                min_size=1,
                max_size=64,
            )
        ),
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
            st.text(alphabet="0123456789abcdef", min_size=64, max_size=64)
        ),
    )


@st.composite
def requested_envelopes(
    draw: st.DrawFn,
) -> MessageEnvelope[VkExecutionRequested]:
    payload = draw(requested_payloads())
    return MessageEnvelope[VkExecutionRequested](
        message_id=draw(st.uuids()),
        message_type="vk.execution.requested",
        occurred_at=datetime.now(UTC),
        producer="tasks-service",
        correlation_id=payload.execution_id,
        payload=payload,
    )


@given(envelope=requested_envelopes())
def test_envelope_round_trip(
    envelope: MessageEnvelope[VkExecutionRequested],
) -> None:
    restored = MessageEnvelope[VkExecutionRequested].model_validate(
        envelope.to_wire()
    )
    assert restored == envelope


@given(payload=requested_payloads())
def test_payload_round_trip(payload: VkExecutionRequested) -> None:
    assert VkExecutionRequested.model_validate(payload.to_wire()) == payload


@given(payload=requested_payloads())
def test_partition_key_is_deterministic(payload: VkExecutionRequested) -> None:
    key = VK_EXECUTION_REQUESTED.partition_key
    assert key is not None
    assert key.compute(payload) == key.compute(payload)


EXTRA_PATHS = (
    (),
    ("payload",),
    ("payload", "postSelection"),
    ("payload", "demands", 0),
    ("payload", "demands", 0, "source"),
)


def _validate_extra(
    envelope: MessageEnvelope[VkExecutionRequested],
    path: tuple[object, ...],
    mode: Literal["forbid", "ignore"],
) -> MessageEnvelope[VkExecutionRequested]:
    wire = envelope.to_wire()
    target: Any = wire
    for segment in path:
        target = target[segment]
    target["futureField"] = "value"
    return MessageEnvelope[VkExecutionRequested].model_validate(
        wire,
        extra=mode,
    )


@pytest.mark.parametrize("path", EXTRA_PATHS)
@given(envelope=requested_envelopes())
def test_extra_rejected_on_publish(
    path: tuple[object, ...],
    envelope: MessageEnvelope[VkExecutionRequested],
) -> None:
    with pytest.raises(ValidationError):
        _validate_extra(envelope, path, "forbid")


@pytest.mark.parametrize("path", EXTRA_PATHS)
@given(envelope=requested_envelopes())
def test_extra_ignored_on_consume(
    path: tuple[object, ...],
    envelope: MessageEnvelope[VkExecutionRequested],
) -> None:
    assert _validate_extra(envelope, path, "ignore") == envelope
