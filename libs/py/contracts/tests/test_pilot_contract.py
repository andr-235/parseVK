"""Focused tests for the canonical vk.execution.requested contract."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID, uuid4

import pytest
from pydantic import ValidationError

from parsevk_contracts.envelope import MessageEnvelope
from parsevk_contracts.errors import ContractValidationError
from parsevk_contracts.validation import prepare_for_publish
from parsevk_contracts.vk.commands import (
    CATALOG,
    VK_EXECUTION_REQUESTED,
    CommentSelection,
    PostSelection,
    SourceReference,
    VkExecutionRequested,
    VkSourceDemandRequest,
)


def demand(
    demand_id: UUID | None = None,
    source_id: UUID | None = None,
    external_id: str = "123",
) -> VkSourceDemandRequest:
    return VkSourceDemandRequest(
        demand_id=demand_id or uuid4(),
        source=SourceReference(
            source_id=source_id or uuid4(),
            provider="vk",
            source_type="community",
            external_id=external_id,
            owner_id=-int(external_id),
        ),
    )


def payload(
    demands: tuple[VkSourceDemandRequest, ...] | None = None,
) -> VkExecutionRequested:
    return VkExecutionRequested(
        task_id=1,
        owner_user_id="user-1",
        task_run_id=uuid4(),
        execution_id=uuid4(),
        demands=demands or (demand(),),
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


def producer_payload(execution_id: UUID) -> dict[str, object]:
    value = payload()
    return value.model_dump(mode="python") | {"execution_id": execution_id}


class TestCanonicalPayload:
    def test_valid_payload_and_wire_aliases(self) -> None:
        value = payload()
        wire = value.to_wire()
        assert wire["ownerUserId"] == "user-1"
        assert VkExecutionRequested.model_validate(wire) == value

    def test_owner_is_required(self) -> None:
        wire = payload().to_wire()
        wire.pop("ownerUserId")
        with pytest.raises(ValidationError):
            VkExecutionRequested.model_validate(wire)

    def test_source_identity_must_match(self) -> None:
        with pytest.raises(ValidationError, match="ownerId must equal"):
            SourceReference(
                source_id=uuid4(),
                provider="vk",
                source_type="community",
                external_id="456",
                owner_id=-999,
            )

    def test_duplicate_demand_and_source_ids_are_rejected(self) -> None:
        demand_id, source_id = uuid4(), uuid4()
        with pytest.raises(ValidationError):
            payload(
                (
                    demand(demand_id, source_id, "111"),
                    demand(demand_id, source_id, "222"),
                )
            )


class TestCatalogAndProducer:
    def test_contract_registration_and_partition_key(self) -> None:
        contract = CATALOG.get("vk.execution.requested")
        assert contract is VK_EXECUTION_REQUESTED
        value = payload()
        assert contract.partition_key is not None
        assert contract.partition_key.compute(value) == str(value.execution_id)

    def test_strict_producer_payload_is_accepted(self) -> None:
        execution_id = uuid4()
        prepared = prepare_for_publish(
            CATALOG,
            message_type="vk.execution.requested",
            producer="tasks-service",
            message_id=uuid4(),
            occurred_at=datetime.now(UTC),
            correlation_id=execution_id,
            causation_id=None,
            payload=producer_payload(execution_id),
        )
        assert prepared.envelope.payload.owner_user_id == "user-1"

    def test_camel_case_producer_payload_is_rejected(self) -> None:
        value = payload()
        with pytest.raises(ContractValidationError):
            prepare_for_publish(
                CATALOG,
                message_type="vk.execution.requested",
                producer="tasks-service",
                message_id=uuid4(),
                occurred_at=datetime.now(UTC),
                correlation_id=value.execution_id,
                causation_id=None,
                payload=value.to_wire(),
            )

    def test_envelope_round_trip(self) -> None:
        value = payload()
        envelope = MessageEnvelope[VkExecutionRequested](
            message_id=uuid4(),
            message_type="vk.execution.requested",
            occurred_at=datetime.now(UTC),
            producer="tasks-service",
            correlation_id=value.execution_id,
            payload=value,
        )
        assert MessageEnvelope[VkExecutionRequested].model_validate(
            envelope.to_wire()
        ) == envelope
