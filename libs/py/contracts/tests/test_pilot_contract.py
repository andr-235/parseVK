"""Tests for the pilot contract vk.execution.requested."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID, uuid4

import pytest
from pydantic import ValidationError

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


def make_valid_producer_payload_dict(
    task_run_id: object = None,
    execution_id: object = None,
    include_thread_replies: object = True,
) -> dict[str, object]:
    """Build a valid producer payload dict with snake_case keys and non-empty demands."""
    uid1, uid2, uid3 = uuid4(), uuid4(), uuid4()
    return {
        "task_id": 1,
        "task_run_id": uid1 if task_run_id is None else task_run_id,
        "execution_id": uid2 if execution_id is None else execution_id,
        "demands": ({
            "demand_id": uid3,
            "source": {
                "source_id": uuid4(),
                "provider": "vk",
                "source_type": "community",
                "external_id": "123",
                "owner_id": -123,
            },
        },),
        "post_selection": {
            "strategy": "latestByPublishedAt",
            "limit_per_source": 100,
        },
        "comment_selection": {
            "mode": "all",
            "include_thread_replies": include_thread_replies,
        },
        "task_revision": 1,
        "source_set_revision": 1,
        "snapshot_sha256": "a" * 64,
    }


class TestPilotProducer:
    """Real-world producer boundary tests for vk.execution.requested."""

    def test_snake_case_uuid_tuple_accept(self) -> None:
        """snake_case + UUID objects + tuple → accepted."""
        from parsevk_contracts.validation import prepare_for_publish

        execution_id = uuid4()
        payload = make_valid_producer_payload_dict(execution_id=execution_id)
        result = prepare_for_publish(
            CATALOG,
            message_type="vk.execution.requested",
            schema_version=1,
            producer="tasks-service",
            message_id=uuid4(),
            occurred_at=datetime.now(UTC),
            correlation_id=execution_id,
            causation_id=None,
            payload=payload,
        )
        assert isinstance(result.envelope.payload, VkExecutionRequested)

    def test_camel_case_payload_rejected(self) -> None:
        """camelCase keys in producer payload → rejected (non-empty demands)."""
        from parsevk_contracts.errors import ContractValidationError
        from parsevk_contracts.validation import prepare_for_publish

        execution_id = uuid4()
        payload: dict[str, object] = {
            "taskId": 1,
            "taskRunId": uuid4(),
            "executionId": execution_id,
            "demands": ({
                "demandId": uuid4(),
                "source": {
                    "sourceId": uuid4(),
                    "provider": "vk",
                    "sourceType": "community",
                    "externalId": "123",
                    "ownerId": -123,
                },
            },),
            "postSelection": {"strategy": "latestByPublishedAt", "limitPerSource": 100},
            "commentSelection": {"mode": "all", "includeThreadReplies": True},
            "taskRevision": 1,
            "sourceSetRevision": 1,
            "snapshotSha256": "a" * 64,
        }
        with pytest.raises(ContractValidationError):
            prepare_for_publish(
                CATALOG,
                message_type="vk.execution.requested",
                schema_version=1,
                producer="tasks-service",
                message_id=uuid4(),
                occurred_at=datetime.now(UTC),
                correlation_id=execution_id,
                causation_id=None,
                payload=payload,
            )

    def test_uuid_string_rejected(self) -> None:
        """UUID as string in producer payload → rejected (strict)."""
        from parsevk_contracts.errors import ContractValidationError
        from parsevk_contracts.validation import prepare_for_publish

        payload = make_valid_producer_payload_dict(
            task_run_id=str(uuid4()),
            execution_id=str(uuid4()),
        )
        with pytest.raises(ContractValidationError):
            prepare_for_publish(
                CATALOG,
                message_type="vk.execution.requested",
                schema_version=1,
                producer="tasks-service",
                message_id=uuid4(),
                occurred_at=datetime.now(UTC),
                correlation_id=uuid4(),
                causation_id=None,
                payload=payload,
            )

    def test_demands_list_rejected(self) -> None:
        """demands as list (not tuple) → rejected (strict)."""
        from parsevk_contracts.errors import ContractValidationError
        from parsevk_contracts.validation import prepare_for_publish

        payload = make_valid_producer_payload_dict()
        payload["demands"] = list(payload["demands"])  # tuple → list
        with pytest.raises(ContractValidationError):
            prepare_for_publish(
                CATALOG,
                message_type="vk.execution.requested",
                schema_version=1,
                producer="tasks-service",
                message_id=uuid4(),
                occurred_at=datetime.now(UTC),
                correlation_id=uuid4(),
                causation_id=None,
                payload=payload,
            )


class TestCommentSelectionValidation:
    """include_thread_replies must be true (not 1, not 1.0)."""

    def make_wire(self, include_thread_replies: object) -> bytes:
        import json
        data = {
            "messageId": str(uuid4()),
            "messageType": "vk.execution.requested",
            "schemaVersion": 1,
            "occurredAt": datetime.now(UTC).isoformat(),
            "producer": "tasks-service",
            "causationId": None,
            "payload": {
                "taskId": 1,
                "taskRunId": str(uuid4()),
                "executionId": str(uuid4()),
                "demands": [],
                "postSelection": {"strategy": "latestByPublishedAt", "limitPerSource": 100},
                "commentSelection": {"mode": "all", "includeThreadReplies": include_thread_replies},
                "taskRevision": 1,
                "sourceSetRevision": 1,
                "snapshotSha256": "a" * 64,
            },
        }
        return json.dumps(data).encode("utf-8")

    def fix_wire(self, data: dict[str, object], exec_id: UUID) -> bytes:
        import json
        data["correlationId"] = str(exec_id)
        data["payload"]["executionId"] = str(exec_id)
        data["payload"]["demands"] = [{
            "demandId": str(uuid4()),
            "source": {
                "sourceId": str(uuid4()),
                "provider": "vk",
                "sourceType": "community",
                "externalId": "123",
                "ownerId": -123,
            },
        }]
        return json.dumps(data).encode("utf-8")

    def test_consumer_true_accept(self) -> None:
        from json import loads

        from parsevk_contracts.validation import parse_for_consume
        exec_id = uuid4()
        raw = loads(self.make_wire(True))
        result = parse_for_consume(
            CATALOG, consumer="vk-service", topic="parsevk.vk.commands",
            value=self.fix_wire(raw, exec_id),
        )
        assert result.envelope.payload.comment_selection.include_thread_replies is True

    def test_consumer_one_rejected(self) -> None:
        from json import loads

        from parsevk_contracts.errors import ContractError
        from parsevk_contracts.validation import parse_for_consume
        exec_id = uuid4()
        with pytest.raises(ContractError):
            parse_for_consume(
                CATALOG, consumer="vk-service", topic="parsevk.vk.commands",
                value=self.fix_wire(loads(self.make_wire(1)), exec_id),
            )

    def test_consumer_one_point_zero_rejected(self) -> None:
        from json import loads

        from parsevk_contracts.errors import ContractError
        from parsevk_contracts.validation import parse_for_consume
        exec_id = uuid4()
        with pytest.raises(ContractError):
            parse_for_consume(
                CATALOG, consumer="vk-service", topic="parsevk.vk.commands",
                value=self.fix_wire(loads(self.make_wire(1.0)), exec_id),
            )

    def test_producer_true_accept(self) -> None:
        from parsevk_contracts.validation import prepare_for_publish
        execution_id = uuid4()
        uid1, uid2 = uuid4(), uuid4()
        payload: dict[str, object] = {
            "task_id": 1,
            "task_run_id": uid1,
            "execution_id": execution_id,
            "demands": ({
                "demand_id": uid2,
                "source": {
                    "source_id": uuid4(),
                    "provider": "vk",
                    "source_type": "community",
                    "external_id": "123",
                    "owner_id": -123,
                },
            },),
            "post_selection": {"strategy": "latestByPublishedAt", "limit_per_source": 100},
            "comment_selection": {"mode": "all", "include_thread_replies": True},
            "task_revision": 1,
            "source_set_revision": 1,
            "snapshot_sha256": "a" * 64,
        }
        result = prepare_for_publish(
            CATALOG,
            message_type="vk.execution.requested",
            schema_version=1,
            producer="tasks-service",
            message_id=uuid4(),
            occurred_at=datetime.now(UTC),
            correlation_id=execution_id,
            causation_id=None,
            payload=payload,
        )
        assert result.envelope.payload.comment_selection.include_thread_replies is True

    def test_producer_one_rejected(self) -> None:
        from parsevk_contracts.errors import ContractValidationError
        from parsevk_contracts.validation import prepare_for_publish
        execution_id = uuid4()
        payload = make_valid_producer_payload_dict(
            execution_id=execution_id,
            include_thread_replies=1,
        )
        with pytest.raises(ContractValidationError):
            prepare_for_publish(
                CATALOG,
                message_type="vk.execution.requested",
                schema_version=1,
                producer="tasks-service",
                message_id=uuid4(),
                occurred_at=datetime.now(UTC),
                correlation_id=execution_id,
                causation_id=None,
                payload=payload,
            )


class TestProducerEnvelopeStrictMetadata:
    """Strict validation of producer envelope metadata fields."""

    def test_message_id_uuid_accept(self) -> None:
        from parsevk_contracts.validation import prepare_for_publish
        execution_id = uuid4()
        result = prepare_for_publish(
            CATALOG,
            message_type="vk.execution.requested",
            schema_version=1,
            producer="tasks-service",
            message_id=uuid4(),
            occurred_at=datetime.now(UTC),
            correlation_id=execution_id,
            causation_id=None,
            payload=make_valid_producer_payload_dict(execution_id=execution_id),
        )
        assert isinstance(result.envelope.message_id, UUID)

    def test_message_id_string_rejected(self) -> None:
        from parsevk_contracts.errors import ContractValidationError
        from parsevk_contracts.validation import prepare_for_publish
        execution_id = uuid4()
        with pytest.raises(ContractValidationError):
            prepare_for_publish(
                CATALOG,
                message_type="vk.execution.requested",
                schema_version=1,
                producer="tasks-service",
                message_id=str(uuid4()),  # type: ignore[arg-type]
                occurred_at=datetime.now(UTC),
                correlation_id=execution_id,
                causation_id=None,
                payload=make_valid_producer_payload_dict(execution_id=execution_id),
            )

    def test_occurred_at_aware_datetime_accept(self) -> None:
        from parsevk_contracts.validation import prepare_for_publish
        execution_id = uuid4()
        result = prepare_for_publish(
            CATALOG,
            message_type="vk.execution.requested",
            schema_version=1,
            producer="tasks-service",
            message_id=uuid4(),
            occurred_at=datetime.now(UTC),
            correlation_id=execution_id,
            causation_id=None,
            payload=make_valid_producer_payload_dict(execution_id=execution_id),
        )
        assert result.envelope.occurred_at is not None

    def test_occurred_at_iso_string_rejected(self) -> None:
        from parsevk_contracts.errors import ContractValidationError
        from parsevk_contracts.validation import prepare_for_publish
        execution_id = uuid4()
        with pytest.raises(ContractValidationError):
            prepare_for_publish(
                CATALOG,
                message_type="vk.execution.requested",
                schema_version=1,
                producer="tasks-service",
                message_id=uuid4(),
                occurred_at=datetime.now(UTC).isoformat(),  # type: ignore[arg-type]
                correlation_id=execution_id,
                causation_id=None,
                payload=make_valid_producer_payload_dict(execution_id=execution_id),
            )

    def test_occurred_at_naive_datetime_rejected(self) -> None:
        from datetime import datetime

        from parsevk_contracts.errors import ContractValidationError
        from parsevk_contracts.validation import prepare_for_publish
        execution_id = uuid4()
        with pytest.raises(ContractValidationError):
            prepare_for_publish(
                CATALOG,
                message_type="vk.execution.requested",
                schema_version=1,
                producer="tasks-service",
                message_id=uuid4(),
                occurred_at=datetime(2026, 7, 30, 12, 0, 0),  # type: ignore[arg-type]
                correlation_id=execution_id,
                causation_id=None,
                payload=make_valid_producer_payload_dict(execution_id=execution_id),
            )

    def test_correlation_id_uuid_accept(self) -> None:
        from parsevk_contracts.validation import prepare_for_publish
        execution_id = uuid4()
        result = prepare_for_publish(
            CATALOG,
            message_type="vk.execution.requested",
            schema_version=1,
            producer="tasks-service",
            message_id=uuid4(),
            occurred_at=datetime.now(UTC),
            correlation_id=execution_id,
            causation_id=None,
            payload=make_valid_producer_payload_dict(execution_id=execution_id),
        )
        assert isinstance(result.envelope.correlation_id, UUID)

    def test_correlation_id_string_rejected(self) -> None:
        from parsevk_contracts.errors import ContractValidationError
        from parsevk_contracts.validation import prepare_for_publish
        execution_id = uuid4()
        with pytest.raises(ContractValidationError):
            prepare_for_publish(
                CATALOG,
                message_type="vk.execution.requested",
                schema_version=1,
                producer="tasks-service",
                message_id=uuid4(),
                occurred_at=datetime.now(UTC),
                correlation_id=str(execution_id),  # type: ignore[arg-type]
                causation_id=None,
                payload=make_valid_producer_payload_dict(execution_id=execution_id),
            )

    def test_causation_id_string_rejected(self) -> None:
        from parsevk_contracts.errors import ContractValidationError
        from parsevk_contracts.validation import prepare_for_publish
        execution_id = uuid4()
        with pytest.raises(ContractValidationError):
            prepare_for_publish(
                CATALOG,
                message_type="vk.execution.requested",
                schema_version=1,
                producer="tasks-service",
                message_id=uuid4(),
                occurred_at=datetime.now(UTC),
                correlation_id=execution_id,
                causation_id=str(uuid4()),  # type: ignore[arg-type]
                payload=make_valid_producer_payload_dict(execution_id=execution_id),
            )

    def test_schema_version_one_accept(self) -> None:
        from parsevk_contracts.validation import prepare_for_publish
        execution_id = uuid4()
        result = prepare_for_publish(
            CATALOG,
            message_type="vk.execution.requested",
            schema_version=1,
            producer="tasks-service",
            message_id=uuid4(),
            occurred_at=datetime.now(UTC),
            correlation_id=execution_id,
            causation_id=None,
            payload=make_valid_producer_payload_dict(execution_id=execution_id),
        )
        assert result.envelope.schema_version == 1

    def test_schema_version_true_rejected(self) -> None:
        from parsevk_contracts.errors import ContractValidationError
        from parsevk_contracts.validation import prepare_for_publish
        execution_id = uuid4()
        with pytest.raises(ContractValidationError):
            prepare_for_publish(
                CATALOG,
                message_type="vk.execution.requested",
                schema_version=True,  # type: ignore[arg-type]
                producer="tasks-service",
                message_id=uuid4(),
                occurred_at=datetime.now(UTC),
                correlation_id=execution_id,
                causation_id=None,
                payload=make_valid_producer_payload_dict(execution_id=execution_id),
            )

    def test_schema_version_string_rejected(self) -> None:
        from parsevk_contracts.errors import ContractValidationError
        from parsevk_contracts.validation import prepare_for_publish
        execution_id = uuid4()
        with pytest.raises(ContractValidationError):
            prepare_for_publish(
                CATALOG,
                message_type="vk.execution.requested",
                schema_version="1",  # type: ignore[arg-type]
                producer="tasks-service",
                message_id=uuid4(),
                occurred_at=datetime.now(UTC),
                correlation_id=execution_id,
                causation_id=None,
                payload=make_valid_producer_payload_dict(execution_id=execution_id),
            )

    def test_message_type_int_rejected(self) -> None:
        from parsevk_contracts.errors import ContractValidationError
        from parsevk_contracts.validation import prepare_for_publish
        execution_id = uuid4()
        with pytest.raises(ContractValidationError):
            prepare_for_publish(
                CATALOG,
                message_type=123,  # type: ignore[arg-type]
                schema_version=1,
                producer="tasks-service",
                message_id=uuid4(),
                occurred_at=datetime.now(UTC),
                correlation_id=execution_id,
                causation_id=None,
                payload=make_valid_producer_payload_dict(execution_id=execution_id),
            )

    def test_producer_int_rejected(self) -> None:
        from parsevk_contracts.errors import ContractValidationError
        from parsevk_contracts.validation import prepare_for_publish
        execution_id = uuid4()
        with pytest.raises(ContractValidationError):
            prepare_for_publish(
                CATALOG,
                message_type="vk.execution.requested",
                schema_version=1,
                producer=123,  # type: ignore[arg-type]
                message_id=uuid4(),
                occurred_at=datetime.now(UTC),
                correlation_id=execution_id,
                causation_id=None,
                payload=make_valid_producer_payload_dict(execution_id=execution_id),
            )
