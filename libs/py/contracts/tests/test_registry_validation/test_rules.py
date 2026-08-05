"""Tests for canonical registry metadata rules."""

from __future__ import annotations

from parsevk_contracts._base import ContractModel
from parsevk_contracts.catalog import ContractCatalog, MessageContract, PartitionKeySpec
from parsevk_contracts.registry_validation import validate_registry


class SamplePayload(ContractModel):
    entity_id: str
    value: int


def validate_contract(**overrides):
    values = {
        "message_type": "test.event",
        "payload_model": SamplePayload,
        "topic": "test.topic",
        "producers": frozenset({"producer"}),
        "consumers": frozenset({"consumer"}),
        "partition_key": PartitionKeySpec(paths=("entityId",)),
    }
    values.update(overrides)
    contract = MessageContract(**values)
    return validate_registry(ContractCatalog.from_contracts((contract,)))


class TestRules:
    def test_empty_message_type_fails(self) -> None:
        assert any(
            item.code == "empty_message_type"
            for item in validate_contract(message_type="")
        )

    def test_empty_topic_fails(self) -> None:
        assert any(item.code == "empty_topic" for item in validate_contract(topic=""))

    def test_empty_producers_fails(self) -> None:
        violations = validate_contract(producers=frozenset())
        assert any(item.code == "empty_producers" for item in violations)

    def test_empty_consumers_fails(self) -> None:
        violations = validate_contract(consumers=frozenset())
        assert any(item.code == "empty_consumers" for item in violations)

    def test_empty_producer_name_fails(self) -> None:
        violations = validate_contract(producers=frozenset({""}))
        assert any(item.code == "empty_producer_name" for item in violations)

    def test_invalid_payload_model_fails(self) -> None:
        class FakeModel:
            pass

        violations = validate_contract(payload_model=FakeModel)
        assert any(item.code == "invalid_payload_model" for item in violations)

    def test_unsupported_causation_policy_fails(self) -> None:
        violations = validate_contract(causation_policy="invalid")
        assert any(item.code == "unsupported_causation_policy" for item in violations)

    def test_missing_partition_key_fails(self) -> None:
        violations = validate_contract(partition_key=None)
        assert any(item.code == "missing_partition_key" for item in violations)

    def test_correlation_required_without_path_fails(self) -> None:
        violations = validate_contract(
            correlation_required=True,
            correlation_path=None,
        )
        assert any(item.code == "missing_correlation_path" for item in violations)

    def test_valid_contract_has_no_violations(self) -> None:
        assert validate_contract(correlation_path="entityId") == ()
