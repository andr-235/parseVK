"""Tests for registry path validation."""

from __future__ import annotations

from uuid import UUID

from parsevk_contracts._base import ContractModel
from parsevk_contracts.catalog import ContractCatalog, MessageContract, PartitionKeySpec
from parsevk_contracts.registry_validation import validate_registry


class SamplePayload(ContractModel):
    entity_id: str
    value: int


class NestedPayload(ContractModel):
    outer_id: str
    inner: SamplePayload


def violations_for(
    payload_model: type[ContractModel],
    partition_path: str,
    *,
    correlation_path: str | None = None,
):
    contract = MessageContract(
        message_type="test.event",
        payload_model=payload_model,
        topic="test.topic",
        producers=frozenset({"producer"}),
        consumers=frozenset({"consumer"}),
        partition_key=PartitionKeySpec(paths=(partition_path,)),
        correlation_path=correlation_path,
    )
    return validate_registry(ContractCatalog.from_contracts((contract,)))


class TestPathValidation:
    def test_nested_valid_path_passes(self) -> None:
        assert violations_for(NestedPayload, "inner.entityId") == ()

    def test_partition_path_missing_fails(self) -> None:
        violations = violations_for(SamplePayload, "nonexistent")
        assert any(item.code == "invalid_partition_key_path" for item in violations)

    def test_correlation_path_missing_from_payload_fails(self) -> None:
        violations = violations_for(
            SamplePayload,
            "entityId",
            correlation_path="nonexistentField",
        )
        assert any(item.code == "invalid_correlation_path" for item in violations)

    def test_path_into_tuple_item_fails(self) -> None:
        class ItemPayload(ContractModel):
            item_id: str

        class CollectionPayload(ContractModel):
            items: tuple[ItemPayload, ...]

        violations = violations_for(CollectionPayload, "items.itemId")
        assert any(item.code == "invalid_partition_key_path" for item in violations)

    def test_intermediate_list_fails(self) -> None:
        class ItemPayload(ContractModel):
            item_id: str

        class ListPayload(ContractModel):
            items: list[ItemPayload]

        violations = violations_for(ListPayload, "items.itemId")
        assert any(item.code == "invalid_partition_key_path" for item in violations)

    def test_terminal_tuple_fails(self) -> None:
        class TagsPayload(ContractModel):
            tags: tuple[str, ...]

        violations = violations_for(TagsPayload, "tags")
        assert any(item.code == "invalid_partition_key_path" for item in violations)

    def test_terminal_contract_model_fails(self) -> None:
        class OuterPayload(ContractModel):
            inner: SamplePayload

        violations = violations_for(OuterPayload, "inner")
        assert any(item.code == "invalid_partition_key_path" for item in violations)

    def test_terminal_uuid_passes(self) -> None:
        class UuidPayload(ContractModel):
            entity_id: UUID

        assert violations_for(UuidPayload, "entityId") == ()

    def test_nested_contract_model_passes(self) -> None:
        assert violations_for(NestedPayload, "inner.entityId") == ()
