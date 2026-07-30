"""Tests for registry metadata validation."""

from __future__ import annotations

from typing import Any

import pytest

from parsevk_contracts._base import ContractModel
from parsevk_contracts.catalog import ContractCatalog, MessageContract, PartitionKeySpec
from parsevk_contracts.registry_validation import RegistryViolation, validate_registry


class SamplePayload(ContractModel):
    entity_id: str
    value: int


class NestedPayload(ContractModel):
    outer_id: str
    inner: SamplePayload


class NonContractModel:
    """Not a subclass of ContractModel."""


class TestRegistryValidation:
    def test_valid_contract_passes(self) -> None:
        """A fully specified contract passes validation."""
        contract = MessageContract(
            message_type="test.event",
            schema_version=1,
            payload_model=SamplePayload,
            topic="test.topic",
            producers=frozenset({"producer-a"}),
            consumers=frozenset({"consumer-b"}),
            partition_key=PartitionKeySpec(paths=("entityId",)),
            correlation_required=True,
            correlation_path="entityId",
            causation_policy="optional",
            compatibility="backward",
        )
        catalog = ContractCatalog.from_contracts((contract,))
        violations = validate_registry(catalog)
        assert len(violations) == 0

    def test_valid_vk_catalog_passes(self) -> None:
        """The existing VK_CATALOG should pass validation."""
        from parsevk_contracts.vk.commands import CATALOG as VK_CATALOG

        violations = validate_registry(VK_CATALOG)
        assert len(violations) == 0

    def test_empty_message_type_fails(self) -> None:
        """Empty message_type is a violation."""
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
        codes = [v.code for v in violations]
        assert "empty_message_type" in codes

    def test_schema_version_zero_fails(self) -> None:
        """schema_version=0 is a violation."""
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
        codes = [v.code for v in violations]
        assert "invalid_schema_version" in codes

    def test_schema_version_negative_fails(self) -> None:
        """Negative schema_version is a violation."""
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
        codes = [v.code for v in violations]
        assert "invalid_schema_version" in codes

    def test_schema_version_bool_fails(self) -> None:
        """schema_version=True (bool) is a violation."""
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
        codes = [v.code for v in violations]
        assert "invalid_schema_version" in codes

    def test_empty_topic_fails(self) -> None:
        """Empty topic is a violation."""
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
        codes = [v.code for v in violations]
        assert "empty_topic" in codes

    def test_empty_producers_fails(self) -> None:
        """Empty producers is a violation."""
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
        codes = [v.code for v in violations]
        assert "empty_producers" in codes

    def test_empty_consumers_fails(self) -> None:
        """Empty consumers is a violation."""
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
        codes = [v.code for v in violations]
        assert "empty_consumers" in codes

    def test_empty_producer_name_fails(self) -> None:
        """Empty string in producers is a violation."""
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
        codes = [v.code for v in violations]
        assert "empty_producer_name" in codes

    def test_missing_partition_key_fails(self) -> None:
        """Missing partition_key is a violation."""
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
        codes = [v.code for v in violations]
        assert "missing_partition_key" in codes

    def test_empty_partition_key_paths_fails(self) -> None:
        """Empty partition_key.paths is a violation."""
        spec = PartitionKeySpec(paths=("entityId",))
        # We need to bypass PartitionKeySpec validation to test empty paths
        # at the registry level — use object.__setattr__ to create an invalid spec
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
        codes = [v.code for v in violations]
        assert "empty_partition_key_paths" in codes

    def test_correlation_required_without_path_fails(self) -> None:
        """correlation_required=True without correlation_path is a violation."""
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
        codes = [v.code for v in violations]
        assert "missing_correlation_path" in codes

    def test_correlation_path_missing_from_payload_fails(self) -> None:
        """correlation_path pointing to nonexistent field is a violation."""
        contract = MessageContract(
            message_type="test.event",
            schema_version=1,
            payload_model=SamplePayload,
            topic="test.topic",
            producers=frozenset({"producer"}),
            consumers=frozenset({"consumer"}),
            partition_key=PartitionKeySpec(paths=("entityId",)),
            correlation_path="nonexistentField",
        )
        catalog = ContractCatalog.from_contracts((contract,))
        violations = validate_registry(catalog)
        codes = [v.code for v in violations]
        assert "invalid_correlation_path" in codes

    def test_partition_path_missing_fails(self) -> None:
        """partition_key.path pointing to nonexistent field is a violation."""
        contract = MessageContract(
            message_type="test.event",
            schema_version=1,
            payload_model=SamplePayload,
            topic="test.topic",
            producers=frozenset({"producer"}),
            consumers=frozenset({"consumer"}),
            partition_key=PartitionKeySpec(paths=("nonexistent",)),
        )
        catalog = ContractCatalog.from_contracts((contract,))
        violations = validate_registry(catalog)
        codes = [v.code for v in violations]
        assert "invalid_partition_key_path" in codes

    def test_nested_valid_path_passes(self) -> None:
        """Path into a nested ContractModel is valid."""
        contract = MessageContract(
            message_type="test.nested",
            schema_version=1,
            payload_model=NestedPayload,
            topic="test.topic",
            producers=frozenset({"producer"}),
            consumers=frozenset({"consumer"}),
            partition_key=PartitionKeySpec(paths=("inner.entityId",)),
        )
        catalog = ContractCatalog.from_contracts((contract,))
        violations = validate_registry(catalog)
        assert len(violations) == 0

    def test_path_into_tuple_item_passes(self) -> None:
        """Path into a field inside a tuple of ContractModels is valid."""

        class ItemPayload(ContractModel):
            item_id: str

        class CollectionPayload(ContractModel):
            items: tuple[ItemPayload, ...]

        contract = MessageContract(
            message_type="test.collection",
            schema_version=1,
            payload_model=CollectionPayload,
            topic="test.topic",
            producers=frozenset({"producer"}),
            consumers=frozenset({"consumer"}),
            partition_key=PartitionKeySpec(paths=("items.itemId",)),
        )
        catalog = ContractCatalog.from_contracts((contract,))
        violations = validate_registry(catalog)
        assert len(violations) == 0

    def test_terminal_object_path_fails(self) -> None:
        """Path terminating in a ContractModel (object) is invalid."""

        class OuterPayload(ContractModel):
            inner: SamplePayload

        contract = MessageContract(
            message_type="test.outer",
            schema_version=1,
            payload_model=OuterPayload,
            topic="test.topic",
            producers=frozenset({"producer"}),
            consumers=frozenset({"consumer"}),
            partition_key=PartitionKeySpec(paths=("inner",)),
        )
        catalog = ContractCatalog.from_contracts((contract,))
        violations = validate_registry(catalog)
        codes = [v.code for v in violations]
        assert "invalid_partition_key_path" in codes

    def test_payload_model_not_contract_model_fails(self) -> None:
        """payload_model not a ContractModel subclass is a violation."""

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
        codes = [v.code for v in violations]
        assert "invalid_payload_model" in codes

    def test_registry_violation_dataclass(self) -> None:
        """RegistryViolation is a frozen dataclass with all fields."""
        v = RegistryViolation(
            code="test_code",
            message_type="test.type",
            schema_version=1,
            field="test_field",
            detail="Test detail",
        )
        assert v.code == "test_code"
        assert v.message_type == "test.type"
        assert v.schema_version == 1
        assert v.field == "test_field"
        assert v.detail == "Test detail"

    def test_unsupported_compatibility_fails(self) -> None:
        """Unsupported compatibility value is a violation."""
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
        codes = [v.code for v in violations]
        assert "unsupported_compatibility" in codes

    def test_unsupported_causation_policy_fails(self) -> None:
        """Unsupported causation_policy value is a violation."""
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
        codes = [v.code for v in violations]
        assert "unsupported_causation_policy" in codes