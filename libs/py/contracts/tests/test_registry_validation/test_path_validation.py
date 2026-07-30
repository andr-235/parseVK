"""Tests for path validation in registry_validation."""

from __future__ import annotations

from parsevk_contracts._base import ContractModel
from parsevk_contracts.catalog import ContractCatalog, MessageContract, PartitionKeySpec
from parsevk_contracts.registry_validation import validate_registry


class SamplePayload(ContractModel):
    entity_id: str
    value: int


class NestedPayload(ContractModel):
    outer_id: str
    inner: SamplePayload


class TestPathValidation:
    def test_nested_valid_path_passes(self) -> None:
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

    def test_partition_path_missing_fails(self) -> None:
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
        assert any("invalid_partition_key_path" in v.code for v in violations)

    def test_correlation_path_missing_from_payload_fails(self) -> None:
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
        assert any("invalid_correlation_path" in v.code for v in violations)

    def test_path_into_tuple_item_fails(self) -> None:
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
        assert any("invalid_partition_key_path" in v.code for v in violations)

    def test_intermediate_list_fails(self) -> None:
        class InnerPayload(ContractModel):
            item_id: str

        class ListPayload(ContractModel):
            items: list[InnerPayload]

        contract = MessageContract(
            message_type="test.listpath",
            schema_version=1,
            payload_model=ListPayload,
            topic="test.topic",
            producers=frozenset({"producer"}),
            consumers=frozenset({"consumer"}),
            partition_key=PartitionKeySpec(paths=("items.itemId",)),
        )
        catalog = ContractCatalog.from_contracts((contract,))
        violations = validate_registry(catalog)
        assert any("invalid_partition_key_path" in v.code for v in violations)

    def test_terminal_tuple_fails(self) -> None:
        class TagsPayload(ContractModel):
            tags: tuple[str, ...]

        contract = MessageContract(
            message_type="test.tags",
            schema_version=1,
            payload_model=TagsPayload,
            topic="test.topic",
            producers=frozenset({"producer"}),
            consumers=frozenset({"consumer"}),
            partition_key=PartitionKeySpec(paths=("tags",)),
        )
        catalog = ContractCatalog.from_contracts((contract,))
        violations = validate_registry(catalog)
        assert any("invalid_partition_key_path" in v.code for v in violations)

    def test_terminal_contract_model_fails(self) -> None:
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
        assert any("invalid_partition_key_path" in v.code for v in violations)

    def test_terminal_uuid_passes(self) -> None:
        from uuid import UUID

        class UuidPayload(ContractModel):
            entity_id: UUID

        contract = MessageContract(
            message_type="test.uuid",
            schema_version=1,
            payload_model=UuidPayload,
            topic="test.topic",
            producers=frozenset({"producer"}),
            consumers=frozenset({"consumer"}),
            partition_key=PartitionKeySpec(paths=("entityId",)),
        )
        catalog = ContractCatalog.from_contracts((contract,))
        violations = validate_registry(catalog)
        assert len(violations) == 0

    def test_nested_contract_model_passes(self) -> None:
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