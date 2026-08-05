"""Tests for registry validation orchestration."""

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
            payload_model=SamplePayload,
            topic="test.topic",
            producers=frozenset({"producer-a"}),
            consumers=frozenset({"consumer-b"}),
            partition_key=PartitionKeySpec(paths=("entityId",)),
            correlation_required=True,
            correlation_path="entityId",
            causation_policy="optional",
        )
        assert validate_registry(ContractCatalog.from_contracts((contract,))) == ()

    def test_valid_vk_catalog_passes(self) -> None:
        from parsevk_contracts.vk.commands import CATALOG as VK_CATALOG

        assert validate_registry(VK_CATALOG) == ()

    def test_registry_violation_is_unversioned(self) -> None:
        violation = RegistryViolation(
            code="test_code",
            message_type="test.type",
            field="test_field",
            detail="Test detail",
        )
        assert violation.code == "test_code"
        assert violation.message_type == "test.type"
        assert violation.field == "test_field"
        assert violation.detail == "Test detail"
        assert not hasattr(violation, "schema_version")
