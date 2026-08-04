from __future__ import annotations

from parsevk_contracts._base import ContractModel
from parsevk_contracts.catalog import MessageContract
from parsevk_contracts.registry_validation.models import (
    SUPPORTED_CAUSATION_POLICIES,
    RegistryViolation,
)
from parsevk_contracts.registry_validation.path_validation import validate_path


def _add(
    violations: list[RegistryViolation],
    contract: MessageContract,
    code: str,
    field: str,
    detail: str,
) -> None:
    violations.append(
        RegistryViolation(code, contract.message_type, field, detail)
    )


def check_contract(
    contract: MessageContract,
    violations: list[RegistryViolation],
) -> None:
    if not contract.message_type:
        _add(
            violations,
            contract,
            "empty_message_type",
            "message_type",
            "message_type must not be empty",
        )
    if not contract.topic:
        _add(violations, contract, "empty_topic", "topic", "topic must not be empty")
    valid_model = isinstance(contract.payload_model, type) and issubclass(
        contract.payload_model,
        ContractModel,
    )
    if not valid_model:
        _add(
            violations,
            contract,
            "invalid_payload_model",
            "payload_model",
            "payload_model must extend ContractModel",
        )
    if not contract.producers:
        _add(
            violations,
            contract,
            "empty_producers",
            "producers",
            "producers must not be empty",
        )
    elif any(not producer for producer in contract.producers):
        _add(
            violations,
            contract,
            "empty_producer_name",
            "producers",
            "producer name must not be empty",
        )
    if not contract.consumers:
        _add(
            violations,
            contract,
            "empty_consumers",
            "consumers",
            "consumers must not be empty",
        )
    elif any(not consumer for consumer in contract.consumers):
        _add(
            violations,
            contract,
            "empty_consumer_name",
            "consumers",
            "consumer name must not be empty",
        )
    if contract.causation_policy not in SUPPORTED_CAUSATION_POLICIES:
        _add(
            violations,
            contract,
            "unsupported_causation_policy",
            "causation_policy",
            f"unsupported causation_policy: {contract.causation_policy!r}",
        )
    partition_key = contract.partition_key
    if partition_key is None:
        _add(
            violations,
            contract,
            "missing_partition_key",
            "partition_key",
            "partition_key must be set",
        )
    elif valid_model:
        for path in partition_key.paths:
            for error in validate_path(contract.payload_model, path):
                _add(
                    violations,
                    contract,
                    "invalid_partition_key_path",
                    "partition_key.paths",
                    error,
                )
    if contract.correlation_required and not contract.correlation_path:
        _add(
            violations,
            contract,
            "missing_correlation_path",
            "correlation_path",
            "correlation_required requires correlation_path",
        )
    if contract.correlation_path and valid_model:
        for error in validate_path(
            contract.payload_model,
            contract.correlation_path,
        ):
            _add(
                violations,
                contract,
                "invalid_correlation_path",
                "correlation_path",
                error,
            )
