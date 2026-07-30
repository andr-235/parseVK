"""Tests for registry metadata rules (contract-level validation)."""

from __future__ import annotations

from parsevk_contracts._base import ContractModel
from parsevk_contracts.catalog import ContractCatalog, MessageContract, PartitionKeySpec
from parsevk_contracts.registry_validation import validate_registry


class SamplePayload(ContractModel):
    entity_id: str
    value: int


class TestRules:
    def test_empty_message_type_fails(self) -> None:
        contract = MessageContract(
            message_type="",
            schema_version=1,
            payload_model=SamplePayload,
            topic="test.topic",
            producers=frozenset({"producer"}),
            consumers=frozenset({"consumer"}),
            partition_key=PartitionKeySpec(paths=("entityId",)),
        )
        catalog = ContractCatalog.from_contracts((contract,))
        violations = validate_registry(catalog)
        assert any("empty_message_type" in v.code for v in violations)

    def test_schema_version_zero_fails(self) -> None:
        contract = MessageContract(
            message_type="test.event",
            schema_version=0,
            payload_model=SamplePayload,
            topic="test.topic",
            producers=frozenset({"producer"}),
            consumers=frozenset({"consumer"}),
            partition_key=PartitionKeySpec(paths=("entityId",)),
        )
        catalog = ContractCatalog.from_contracts((contract,))
        violations = validate_registry(catalog)
        assert any("invalid_schema_version" in v.code for v in violations)

    def test_schema_version_negative_fails(self) -> None:
        contract = MessageContract(
            message_type="test.event",
            schema_version=-1,
            payload_model=SamplePayload,
            topic="test.topic",
            producers=frozenset({"producer"}),
            consumers=frozenset({"consumer"}),
            partition_key=PartitionKeySpec(paths=("entityId",)),
        )
        catalog = ContractCatalog.from_contracts((contract,))
        violations = validate_registry(catalog)
        assert any("invalid_schema_version" in v.code for v in violations)

    def test_schema_version_bool_fails(self) -> None:
        contract = MessageContract(
            message_type="test.event",
            schema_version=True,  # type: ignore[arg-type]
            payload_model=SamplePayload,
            topic="test.topic",
            producers=frozenset({"producer"}),
            consumers=frozenset({"consumer"}),
            partition_key=PartitionKeySpec(paths=("entityId",)),
        )
        catalog = ContractCatalog.from_contracts((contract,))
        violations = validate_registry(catalog)
        assert any("invalid_schema_version" in v.code for v in violations)

    def test_empty_topic_fails(self) -> None:
        contract = MessageContract(
            message_type="test.event",
            schema_version=1,
            payload_model=SamplePayload,
            topic="",
            producers=frozenset({"producer"}),
            consumers=frozenset({"consumer"}),
            partition_key=PartitionKeySpec(paths=("entityId",)),
        )
        catalog = ContractCatalog.from_contracts((contract,))
        violations = validate_registry(catalog)
        assert any("empty_topic" in v.code for v in violations)

    def test_empty_producers_fails(self) -> None:
        contract = MessageContract(
            message_type="test.event",
            schema_version=1,
            payload_model=SamplePayload,
            topic="test.topic",
            producers=frozenset(),
            consumers=frozenset({"consumer"}),
            partition_key=PartitionKeySpec(paths=("entityId",)),
        )
        catalog = ContractCatalog.from_contracts((contract,))
        violations = validate_registry(catalog)
        assert any("empty_producers" in v.code for v in violations)

    def test_empty_consumers_fails(self) -> None:
        contract = MessageContract(
            message_type="test.event",
            schema_version=1,
            payload_model=SamplePayload,
            topic="test.topic",
            producers=frozenset({"producer"}),
            consumers=frozenset(),
            partition_key=PartitionKeySpec(paths=("entityId",)),
        )
        catalog = ContractCatalog.from_contracts((contract,))
        violations = validate_registry(catalog)
        assert any("empty_consumers" in v.code for v in violations)

    def test_empty_producer_name_fails(self) -> None:
        contract = MessageContract(
            message_type="test.event",
            schema_version=1,
            payload_model=SamplePayload,
            topic="test.topic",
            producers=frozenset({""}),
            consumers=frozenset({"consumer"}),
            partition_key=PartitionKeySpec(paths=("entityId",)),
        )
        catalog = ContractCatalog.from_contracts((contract,))
        violations = validate_registry(catalog)
        assert any("empty_producer_name" in v.code for v in violations)

    def test_payload_model_not_contract_model_fails(self) -> None:
        class FakeModel:
            pass

        contract = MessageContract(
            message_type="test.event",
            schema_version=1,
            payload_model=FakeModel,  # type: ignore[arg-type]
            topic="test.topic",
            producers=frozenset({"producer"}),
            consumers=frozenset({"consumer"}),
            partition_key=PartitionKeySpec(paths=("entityId",)),
        )
        catalog = ContractCatalog.from_contracts((contract,))
        violations = validate_registry(catalog)
        assert any("invalid_payload_model" in v.code for v in violations)

    def test_unsupported_compatibility_fails(self) -> None:
        contract = MessageContract(
            message_type="test.event",
            schema_version=1,
            payload_model=SamplePayload,
            topic="test.topic",
            producers=frozenset({"producer"}),
            consumers=frozenset({"consumer"}),
            partition_key=PartitionKeySpec(paths=("entityId",)),
            compatibility="forward",  # type: ignore[arg-type]
        )
        catalog = ContractCatalog.from_contracts((contract,))
        violations = validate_registry(catalog)
        assert any("unsupported_compatibility" in v.code for v in violations)

    def test_unsupported_causation_policy_fails(self) -> None:
        contract = MessageContract(
            message_type="test.event",
            schema_version=1,
            payload_model=SamplePayload,
            topic="test.topic",
            producers=frozenset({"producer"}),
            consumers=frozenset({"consumer"}),
            partition_key=PartitionKeySpec(paths=("entityId",)),
            causation_policy="invalid",  # type: ignore[arg-type]
        )
        catalog = ContractCatalog.from_contracts((contract,))
        violations = validate_registry(catalog)
        assert any("unsupported_causation_policy" in v.code for v in violations)

    def test_missing_partition_key_fails(self) -> None:
        contract = MessageContract(
            message_type="test.event",
            schema_version=1,
            payload_model=SamplePayload,
            topic="test.topic",
            producers=frozenset({"producer"}),
            consumers=frozenset({"consumer"}),
            partition_key=None,
        )
        catalog = ContractCatalog.from_contracts((contract,))
        violations = validate_registry(catalog)
        assert any("missing_partition_key" in v.code for v in violations)

    def test_empty_partition_key_paths_fails(self) -> None:
        spec = PartitionKeySpec(paths=("entityId",))
        object.__setattr__(spec, "paths", ())
        contract = MessageContract(
            message_type="test.event",
            schema_version=1,
            payload_model=SamplePayload,
            topic="test.topic",
            producers=frozenset({"producer"}),
            consumers=frozenset({"consumer"}),
            partition_key=spec,
        )
        catalog = ContractCatalog.from_contracts((contract,))
        violations = validate_registry(catalog)
        assert any("empty_partition_key_paths" in v.code for v in violations)

    def test_correlation_required_without_path_fails(self) -> None:
        contract = MessageContract(
            message_type="test.event",
            schema_version=1,
            payload_model=SamplePayload,
            topic="test.topic",
            producers=frozenset({"producer"}),
            consumers=frozenset({"consumer"}),
            partition_key=PartitionKeySpec(paths=("entityId",)),
            correlation_required=True,
            correlation_path=None,
        )
        catalog = ContractCatalog.from_contracts((contract,))
        violations = validate_registry(catalog)
        assert any("missing_correlation_path" in v.code for v in violations)