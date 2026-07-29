"""Tests for the pilot contract vk.execution.requested."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID, uuid4

import pytest
from parsevk_contracts.envelope import MessageEnvelope
from parsevk_contracts.vk.commands import (
    CATALOG,
    VK_EXECUTION_REQUESTED,
    CommentSelection,
    PostSelection,
    SourceReference,
    VkExecutionRequested,
    VkSourceDemandRequest,
)
from pydantic import ValidationError


def make_valid_demand(
    demand_id: UUID | None = None,
    source_id: UUID | None = None,
    external_id: str = "123",
    owner_id: int = -123,
) -> VkSourceDemandRequest:
    return VkSourceDemandRequest(
        demand_id=demand_id or uuid4(),
        source=SourceReference(
            source_id=source_id or uuid4(),
            provider="vk",
            source_type="community",
            external_id=external_id,
            owner_id=owner_id,
        ),
    )


def make_valid_payload(
    demands: tuple[VkSourceDemandRequest, ...] | None = None,
) -> VkExecutionRequested:
    if demands is None:
        demands = (make_valid_demand(),)
    return VkExecutionRequested(
        task_id=1,
        task_run_id=uuid4(),
        execution_id=uuid4(),
        demands=demands,
        post_selection=PostSelection(
            strategy="latestByPublishedAt",
            limit_per_source=100,
        ),
        comment_selection=CommentSelection(
            mode="all",
            include_thread_replies=True,
        ),
        task_revision=1,
        source_set_revision=1,
        snapshot_sha256="a" * 64,
    )


class TestSourceReference:
    def test_valid_community(self) -> None:
        """Valid VK community passes validation."""
        ref = SourceReference(
            source_id=uuid4(),
            provider="vk",
            source_type="community",
            external_id="456",
            owner_id=-456,
        )
        assert ref.provider == "vk"
        assert ref.source_type == "community"

    def test_owner_id_mismatch(self) -> None:
        """owner_id must equal -int(external_id)."""
        with pytest.raises(ValidationError, match="ownerId must equal"):
            SourceReference(
                source_id=uuid4(),
                provider="vk",
                source_type="community",
                external_id="456",
                owner_id=-999,
            )

    def test_positive_owner_id(self) -> None:
        """Positive owner_id is rejected (must be negative)."""
        with pytest.raises(ValidationError):
            SourceReference(
                source_id=uuid4(),
                provider="vk",
                source_type="community",
                external_id="456",
                owner_id=456,
            )

    def test_zero_external_id(self) -> None:
        """Zero external_id is rejected (must start with 1-9)."""
        with pytest.raises(ValidationError):
            SourceReference(
                source_id=uuid4(),
                provider="vk",
                source_type="community",
                external_id="0",
                owner_id=0,
            )

    def test_non_digit_external_id(self) -> None:
        """Non-digit external_id is rejected."""
        with pytest.raises(ValidationError):
            SourceReference(
                source_id=uuid4(),
                provider="vk",
                source_type="community",
                external_id="abc",
                owner_id=-1,
            )


class TestVkExecutionRequested:
    def test_valid_payload(self) -> None:
        """Valid payload passes construction."""
        payload = make_valid_payload()
        assert payload.task_id == 1
        assert len(payload.demands) == 1

    def test_empty_demands(self) -> None:
        """Empty demands tuple is rejected (min_length=1)."""
        with pytest.raises(ValidationError):
            make_valid_payload(demands=())

    def test_duplicate_demand_id(self) -> None:
        """Duplicate demand_id raises validation error."""
        dup_id = uuid4()
        demands = (
            make_valid_demand(demand_id=dup_id, external_id="111", owner_id=-111),
            make_valid_demand(demand_id=dup_id, external_id="222", owner_id=-222),
        )
        with pytest.raises(ValidationError, match="Duplicate demand_id"):
            make_valid_payload(demands=demands)

    def test_duplicate_source_id(self) -> None:
        """Duplicate source_id raises validation error."""
        dup_source = uuid4()
        demands = (
            make_valid_demand(source_id=dup_source, external_id="111", owner_id=-111),
            make_valid_demand(source_id=dup_source, external_id="222", owner_id=-222),
        )
        with pytest.raises(ValidationError, match="Duplicate source_id"):
            make_valid_payload(demands=demands)

    def test_invalid_snapshot_sha256(self) -> None:
        """Invalid sha256 hex string is rejected."""
        with pytest.raises(ValidationError):
            VkExecutionRequested(
                task_id=1,
                task_run_id=uuid4(),
                execution_id=uuid4(),
                demands=(make_valid_demand(),),
                post_selection=PostSelection(strategy="latestByPublishedAt", limit_per_source=100),
                comment_selection=CommentSelection(mode="all", include_thread_replies=True),
                task_revision=1,
                source_set_revision=1,
                snapshot_sha256="not-a-valid-sha256",
            )

    def test_short_snapshot_sha256(self) -> None:
        """Too short sha256 is rejected."""
        with pytest.raises(ValidationError):
            VkExecutionRequested(
                task_id=1,
                task_run_id=uuid4(),
                execution_id=uuid4(),
                demands=(make_valid_demand(),),
                post_selection=PostSelection(strategy="latestByPublishedAt", limit_per_source=100),
                comment_selection=CommentSelection(mode="all", include_thread_replies=True),
                task_revision=1,
                source_set_revision=1,
                snapshot_sha256="abc123",
            )


class TestPilotContractCatalog:
    def test_contract_registered(self) -> None:
        """Pilot contract is registered in the catalog."""
        contract = CATALOG.get("vk.execution.requested", 1)
        assert contract is VK_EXECUTION_REQUESTED
        assert contract.topic == "parsevk.vk.commands"
        assert "tasks-service" in contract.producers
        assert "vk-service" in contract.consumers

    def test_partition_key(self) -> None:
        """Partition key is computed from executionId."""
        payload = make_valid_payload()
        key = VK_EXECUTION_REQUESTED.partition_key
        assert key is not None
        result = key.compute(payload)
        assert result == str(payload.execution_id)

    def test_partition_key_deterministic(self) -> None:
        """Same payload always produces same partition key."""
        payload = make_valid_payload()
        key = VK_EXECUTION_REQUESTED.partition_key
        assert key is not None
        assert key.compute(payload) == key.compute(payload)

    def test_partition_key_from_envelope_wire(self) -> None:
        """Partition key can be computed from envelope wire format."""
        from datetime import datetime

        payload = make_valid_payload()
        envelope = MessageEnvelope[VkExecutionRequested](
            message_id=uuid4(),
            message_type="vk.execution.requested",
            schema_version=1,
            occurred_at=datetime.now(UTC),
            producer="tasks-service",
            correlation_id=uuid4(),
            payload=payload,
        )
        key = VK_EXECUTION_REQUESTED.partition_key
        assert key is not None
        result = key.compute_from_wire(envelope.to_wire())
        assert result == str(payload.execution_id)


class TestEnvelopeWithPilotContract:
    def test_envelope_round_trip(self) -> None:
        """Full envelope with pilot contract payload round-trips correctly."""
        now = datetime.now(UTC)
        payload = make_valid_payload()
        envelope = MessageEnvelope[VkExecutionRequested](
            message_id=uuid4(),
            message_type="vk.execution.requested",
            schema_version=1,
            occurred_at=now,
            producer="tasks-service",
            correlation_id=uuid4(),
            payload=payload,
        )
        wire = envelope.to_wire()
        assert wire["messageType"] == "vk.execution.requested"
        assert wire["schemaVersion"] == 1
        assert "payload" in wire
        assert wire["payload"]["executionId"] == str(payload.execution_id)
