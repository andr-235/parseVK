"""Tests for ContractCatalog and MessageContract."""

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


class TestPartitionKeySpec:
    def test_simple_path(self) -> None:
        """Extract a single field value from wire-format dict."""
        spec = PartitionKeySpec(paths=("entityId",))
        payload = SamplePayload(entity_id="abc", value=1)
        assert spec.compute(payload) == "abc"

    def test_composite_key(self) -> None:
        """Join multiple field values with separator."""
        spec = PartitionKeySpec(paths=("entityId", "value"), separator=":")
        payload = SamplePayload(entity_id="abc", value=42)
        assert spec.compute(payload) == "abc:42"

    def test_nested_path(self) -> None:
        """Resolve dot-separated nested paths."""
        spec = PartitionKeySpec(paths=("inner.entityId",))
        payload = NestedPayload(
            outer_id="out", inner=SamplePayload(entity_id="nested", value=7)
        )
        assert spec.compute(payload) == "nested"

    def test_empty_paths_raises(self) -> None:
        """Empty paths tuple raises ValueError."""
        with pytest.raises(ValueError, match="At least one path"):
            PartitionKeySpec(paths=())

    def test_none_path_raises(self) -> None:
        """Path resolving to None raises PartitionKeyError."""
        spec = PartitionKeySpec(paths=("nonexistent",))
        payload = SamplePayload(entity_id="x", value=1)
        with pytest.raises(PartitionKeyError):
            spec.compute(payload)

    def test_deterministic(self) -> None:
        """Same payload always produces same key."""
        spec = PartitionKeySpec(paths=("entityId", "value"))
        payload = SamplePayload(entity_id="det", value=100)
        result1 = spec.compute(payload)
        result2 = spec.compute(payload)
        assert result1 == result2

    def test_separator_empty_raises(self) -> None:
        """Empty separator raises ValueError."""
        with pytest.raises(ValueError):
            PartitionKeySpec(paths=("entityId",), separator="")

    def test_separator_none_raises(self) -> None:
        """None separator raises ValueError."""
        with pytest.raises(ValueError):
            PartitionKeySpec(paths=("entityId",), separator=None)  # type: ignore[arg-type]

    def test_separator_pipe(self) -> None:
        """Pipe separator joins values correctly."""
        spec = PartitionKeySpec(paths=("entityId", "value"), separator="|")
        payload = SamplePayload(entity_id="abc", value=42)
        assert spec.compute(payload) == "abc|42"


class TestMessageContract:
    def test_create_contract(self) -> None:
        """Can create a MessageContract with all fields."""
        contract = MessageContract(
            message_type="test.event",
            schema_version=1,
            payload_model=SamplePayload,
            topic="test.topic",
            producers=frozenset({"producer-a"}),
            consumers=frozenset({"consumer-b"}),
            partition_key=PartitionKeySpec(paths=("entityId",)),
            correlation_required=True,
            causation_policy="optional",
            compatibility="backward",
        )
        assert contract.message_type == "test.event"
        assert contract.schema_version == 1
        assert contract.payload_model is SamplePayload
        assert contract.topic == "test.topic"
        assert "producer-a" in contract.producers
        assert "consumer-b" in contract.consumers
        assert contract.correlation_required is True
        assert contract.causation_policy == "optional"

    def test_default_values(self) -> None:
        """Optional fields have sensible defaults."""
        contract = MessageContract(
            message_type="test.defaults",
            schema_version=1,
            payload_model=SamplePayload,
            topic="test.topic",
            producers=frozenset({"default-producer"}),
            consumers=frozenset({"default-consumer"}),
        )
        assert contract.correlation_required is False
        assert contract.causation_policy == "optional"
        assert contract.compatibility == "backward"
        assert contract.partition_key is None


class TestContractCatalog:
    @pytest.fixture
    def sample_contract(self) -> MessageContract:
        return MessageContract(
            message_type="test.event",
            schema_version=1,
            payload_model=SamplePayload,
            topic="test.topic",
            producers=frozenset({"producer-a"}),
            consumers=frozenset({"consumer-b"}),
            partition_key=PartitionKeySpec(paths=("entityId",)),
            correlation_required=True,
            causation_policy="optional",
        )

    @pytest.fixture
    def catalog(self, sample_contract: MessageContract) -> ContractCatalog:
        return ContractCatalog.from_contracts((sample_contract,))

    def test_get_existing_contract(self, catalog: ContractCatalog) -> None:
        """Can retrieve a registered contract."""
        contract = catalog.get("test.event", 1)
        assert contract.message_type == "test.event"
        assert contract.schema_version == 1

    def test_get_unknown_contract(self, catalog: ContractCatalog) -> None:
        """Missing contract raises UnknownContractError."""
        with pytest.raises(UnknownContractError):
            catalog.get("test.unknown", 1)

    def test_get_wrong_version(self, catalog: ContractCatalog) -> None:
        """Wrong schema_version raises UnknownContractError."""
        with pytest.raises(UnknownContractError):
            catalog.get("test.event", 2)

    def test_get_by_topic(self, catalog: ContractCatalog) -> None:
        """Can retrieve contracts by topic."""
        contracts = catalog.get_by_topic("test.topic")
        assert len(contracts) == 1
        assert contracts[0].message_type == "test.event"

    def test_get_by_topic_empty(self, catalog: ContractCatalog) -> None:
        """Unknown topic returns empty tuple."""
        assert catalog.get_by_topic("nonexistent") == ()

    def test_multiple_contracts(self) -> None:
        """Catalog can hold multiple contracts."""
        c1 = MessageContract(
            message_type="event.a",
            schema_version=1,
            payload_model=SamplePayload,
            topic="topic.a",
            producers=frozenset({"producer-a"}),
            consumers=frozenset({"consumer-a"}),
        )
        c2 = MessageContract(
            message_type="event.b",
            schema_version=1,
            payload_model=SamplePayload,
            topic="topic.b",
            producers=frozenset({"producer-b"}),
            consumers=frozenset({"consumer-b"}),
        )
        cat = ContractCatalog.from_contracts((c1, c2))
        assert cat.get("event.a", 1).message_type == "event.a"
        assert cat.get("event.b", 1).message_type == "event.b"

    def test_catalog_immutable_contracts(self) -> None:
        """Cannot assign to contracts tuple (frozen dataclass)."""
        c1 = MessageContract(
            message_type="event.a",
            schema_version=1,
            payload_model=SamplePayload,
            topic="topic.a",
            producers=frozenset({"producer-a"}),
            consumers=frozenset({"consumer-a"}),
        )
        cat = ContractCatalog.from_contracts((c1,))
        with pytest.raises(FrozenInstanceError):
            cat.contracts = ()  # type: ignore[misc]

    def test_catalog_immutable_by_identity(self) -> None:
        """Cannot modify _by_identity mapping proxy."""
        c1 = MessageContract(
            message_type="event.a",
            schema_version=1,
            payload_model=SamplePayload,
            topic="topic.a",
            producers=frozenset({"producer-a"}),
            consumers=frozenset({"consumer-a"}),
        )
        cat = ContractCatalog.from_contracts((c1,))
        mutable_view = cast(Any, cat._by_identity)
        with pytest.raises(TypeError):
            mutable_view[("other.event", 1)] = c1

    def test_catalog_duplicate_contract(self) -> None:
        """Duplicate contract identity raises DuplicateContractError."""
        c1 = MessageContract(
            message_type="event.a",
            schema_version=1,
            payload_model=SamplePayload,
            topic="topic.a",
            producers=frozenset({"producer-a"}),
            consumers=frozenset({"consumer-a"}),
        )
        with pytest.raises(DuplicateContractError):
            ContractCatalog.from_contracts((c1, c1))
