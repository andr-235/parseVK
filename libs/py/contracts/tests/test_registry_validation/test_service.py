"""Tests for registry validation orchestration (validate_registry service)."""

from __future__ import annotations

from parsevk_contracts._base import ContractModel
from parsevk_contracts.catalog import ContractCatalog, MessageContract, PartitionKeySpec
from parsevk_contracts.registry_validation import RegistryViolation, validate_registry


class SamplePayload(ContractModel):
    entity_id: str
    value: int


class TestService:
    def test_valid_contract_passes(self) -> None:
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
        from parsevk_contracts.vk.commands import CATALOG as VK_CATALOG
        violations = validate_registry(VK_CATALOG)
        assert len(violations) == 0

    def test_registry_violation_dataclass(self) -> None:
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