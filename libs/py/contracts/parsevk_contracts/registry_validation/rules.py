from __future__ import annotations

from parsevk_contracts._base import ContractModel
from parsevk_contracts.catalog import MessageContract
from parsevk_contracts.registry_validation.models import (
    SUPPORTED_CAUSATION_POLICIES,
    SUPPORTED_COMPATIBILITY,
    RegistryViolation,
)
from parsevk_contracts.registry_validation.path_validation import validate_path


def _is_non_bool_int(val: object) -> bool:
    """Check if a value is an int but not a bool."""
    return isinstance(val, int) and not isinstance(val, bool)


def check_contract(
    contract: MessageContract,
    violations: list[RegistryViolation],
) -> None:
    """Validate a single MessageContract for metadata completeness."""
    mt = contract.message_type
    sv = contract.schema_version

    if not mt:
        violations.append(
            RegistryViolation("empty_message_type", mt, sv, "message_type", "message_type must not be empty")
        )

    if not _is_non_bool_int(sv) or sv < 1:
        violations.append(
            RegistryViolation("invalid_schema_version", mt, sv, "schema_version", f"schema_version must be int >= 1, got {sv!r}")
        )

    if not contract.topic:
        violations.append(
            RegistryViolation("empty_topic", mt, sv, "topic", "topic must not be empty")
        )

    if not (isinstance(contract.payload_model, type) and issubclass(contract.payload_model, ContractModel)):
        violations.append(
            RegistryViolation("invalid_payload_model", mt, sv, "payload_model", "payload_model must be a subclass of ContractModel")
        )

    if not contract.producers:
        violations.append(
            RegistryViolation("empty_producers", mt, sv, "producers", "producers must not be empty")
        )
    else:
        for producer in contract.producers:
            if not producer:
                violations.append(
                    RegistryViolation("empty_producer_name", mt, sv, "producers", "producer name must not be empty")
                )

    if not contract.consumers:
        violations.append(
            RegistryViolation("empty_consumers", mt, sv, "consumers", "consumers must not be empty")
        )
    else:
        for consumer in contract.consumers:
            if not consumer:
                violations.append(
                    RegistryViolation("empty_consumer_name", mt, sv, "consumers", "consumer name must not be empty")
                )

    if contract.compatibility not in SUPPORTED_COMPATIBILITY:
        violations.append(
            RegistryViolation("unsupported_compatibility", mt, sv, "compatibility", f"unsupported compatibility: {contract.compatibility!r}")
        )

    if contract.causation_policy not in SUPPORTED_CAUSATION_POLICIES:
        violations.append(
            RegistryViolation("unsupported_causation_policy", mt, sv, "causation_policy", f"unsupported causation_policy: {contract.causation_policy!r}")
        )

    pk = contract.partition_key
    if pk is None:
        violations.append(
            RegistryViolation("missing_partition_key", mt, sv, "partition_key", "partition_key must be set")
        )
    else:
        if not pk.paths:
            violations.append(
                RegistryViolation("empty_partition_key_paths", mt, sv, "partition_key.paths", "partition_key.paths must not be empty")
            )
        elif isinstance(contract.payload_model, type) and issubclass(contract.payload_model, ContractModel):
            for p in pk.paths:
                path_errors = validate_path(contract.payload_model, p)
                for err in path_errors:
                    violations.append(
                        RegistryViolation("invalid_partition_key_path", mt, sv, "partition_key.paths", err)
                    )

    if contract.correlation_required:
        if not contract.correlation_path:
            violations.append(
                RegistryViolation("missing_correlation_path", mt, sv, "correlation_path", "correlation_required=True requires correlation_path to be set")
            )
    if contract.correlation_path and isinstance(contract.payload_model, type) and issubclass(contract.payload_model, ContractModel):
        path_errors = validate_path(contract.payload_model, contract.correlation_path)
        for err in path_errors:
            violations.append(
                RegistryViolation("invalid_correlation_path", mt, sv, "correlation_path", err)
            )