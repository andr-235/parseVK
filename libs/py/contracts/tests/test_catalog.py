"""Tests for the unversioned contract catalog."""

from __future__ import annotations

from dataclasses import FrozenInstanceError
from typing import Any, cast

import pytest

from parsevk_contracts._base import ContractModel
from parsevk_contracts.catalog import ContractCatalog, MessageContract, PartitionKeySpec
from parsevk_contracts.errors import DuplicateContractError, PartitionKeyError, UnknownContractError


class SamplePayload(ContractModel):
    entity_id: str
    value: int


class NestedPayload(ContractModel):
    outer_id: str
    inner: SamplePayload


def make_contract(
    message_type: str = "test.event",
    topic: str = "test.topic",
) -> MessageContract:
    return MessageContract(
        message_type=message_type,
        payload_model=SamplePayload,
        topic=topic,
        producers=frozenset({"producer-a"}),
        consumers=frozenset({"consumer-b"}),
        partition_key=PartitionKeySpec(paths=("entityId",)),
        correlation_required=True,
        correlation_path="entityId",
        causation_policy="optional",
    )


class TestPartitionKeySpec:
    def test_simple_path(self) -> None:
        spec = PartitionKeySpec(paths=("entityId",))
        assert spec.compute(SamplePayload(entity_id="abc", value=1)) == "abc"

    def test_composite_key(self) -> None:
        spec = PartitionKeySpec(paths=("entityId", "value"), separator=":")
        assert spec.compute(SamplePayload(entity_id="abc", value=42)) == "abc:42"

    def test_nested_path(self) -> None:
        spec = PartitionKeySpec(paths=("inner.entityId",))
        payload = NestedPayload(
            outer_id="out",
            inner=SamplePayload(entity_id="nested", value=7),
        )
        assert spec.compute(payload) == "nested"

    def test_empty_paths_raises(self) -> None:
        with pytest.raises(ValueError, match="At least one path"):
            PartitionKeySpec(paths=())

    def test_missing_value_raises(self) -> None:
        spec = PartitionKeySpec(paths=("nonexistent",))
        with pytest.raises(PartitionKeyError):
            spec.compute(SamplePayload(entity_id="x", value=1))

    def test_deterministic(self) -> None:
        spec = PartitionKeySpec(paths=("entityId", "value"))
        payload = SamplePayload(entity_id="det", value=100)
        assert spec.compute(payload) == spec.compute(payload)

    @pytest.mark.parametrize("separator", ["", None])
    def test_invalid_separator_raises(self, separator: str | None) -> None:
        with pytest.raises(ValueError):
            PartitionKeySpec(
                paths=("entityId",),
                separator=separator,  # type: ignore[arg-type]
            )


class TestMessageContract:
    def test_create_contract(self) -> None:
        contract = make_contract()
        assert contract.message_type == "test.event"
        assert contract.payload_model is SamplePayload
        assert contract.topic == "test.topic"
        assert contract.producers == frozenset({"producer-a"})
        assert contract.consumers == frozenset({"consumer-b"})
        assert contract.correlation_required is True
        assert contract.correlation_path == "entityId"
        assert contract.causation_policy == "optional"
        assert not hasattr(contract, "schema_version")
        assert not hasattr(contract, "compatibility")

    def test_default_values(self) -> None:
        contract = MessageContract(
            message_type="test.defaults",
            payload_model=SamplePayload,
            topic="test.topic",
            producers=frozenset({"producer"}),
            consumers=frozenset({"consumer"}),
        )
        assert contract.partition_key is None
        assert contract.correlation_required is False
        assert contract.correlation_path is None
        assert contract.causation_policy == "optional"


class TestContractCatalog:
    @pytest.fixture
    def catalog(self) -> ContractCatalog:
        return ContractCatalog.from_contracts((make_contract(),))

    def test_get_existing_contract(self, catalog: ContractCatalog) -> None:
        assert catalog.get("test.event").message_type == "test.event"

    def test_get_unknown_contract(self, catalog: ContractCatalog) -> None:
        with pytest.raises(UnknownContractError):
            catalog.get("test.unknown")

    def test_get_by_topic(self, catalog: ContractCatalog) -> None:
        assert catalog.get_by_topic("test.topic") == (catalog.get("test.event"),)
        assert catalog.get_by_topic("nonexistent") == ()

    def test_multiple_contracts(self) -> None:
        catalog = ContractCatalog.from_contracts(
            (
                make_contract("event.a", "topic.a"),
                make_contract("event.b", "topic.b"),
            )
        )
        assert catalog.get("event.a").topic == "topic.a"
        assert catalog.get("event.b").topic == "topic.b"

    def test_catalog_is_immutable(self) -> None:
        catalog = ContractCatalog.from_contracts((make_contract(),))
        with pytest.raises(FrozenInstanceError):
            catalog.contracts = ()  # type: ignore[misc]
        mutable_view = cast(Any, catalog._by_type)
        with pytest.raises(TypeError):
            mutable_view["other.event"] = make_contract("other.event")

    def test_duplicate_semantic_type_is_rejected(self) -> None:
        contract = make_contract()
        with pytest.raises(DuplicateContractError):
            ContractCatalog.from_contracts((contract, contract))
