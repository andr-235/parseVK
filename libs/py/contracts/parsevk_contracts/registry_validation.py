"""Registry metadata validation for contract catalogs.

Usage::

    violations = validate_registry(catalog)
"""

from __future__ import annotations

from dataclasses import dataclass
from types import UnionType
from typing import Union, cast, get_args, get_origin

from pydantic.fields import FieldInfo

from ._base import ContractModel
from .catalog import ContractCatalog, MessageContract, PartitionKeySpec

SUPPORTED_CAUSATION_POLICIES = frozenset({"optional", "required", "forbidden"})
SUPPORTED_COMPATIBILITY = frozenset({"backward"})


@dataclass(frozen=True, slots=True)
class RegistryViolation:
    """A single metadata completeness violation in the contract registry."""

    code: str
    message_type: str
    schema_version: int | None
    field: str
    detail: str


def _find_field_by_alias(
    model: type[ContractModel],
    alias: str,
) -> FieldInfo | None:
    """Find a Pydantic model field by its wire-format camelCase alias."""
    for field_name, field_info in model.model_fields.items():
        if field_info.alias == alias:
            return field_info
    return None


def _resolve_contract_model(ann: object) -> type[ContractModel] | None:
    """Extract a ContractModel subclass from a type annotation if possible."""
    if ann is None:
        return None
    if isinstance(ann, type) and issubclass(ann, ContractModel) and ann is not ContractModel:
        return ann
    origin = get_origin(ann)
    args = get_args(ann)
    if origin in (Union, UnionType):
        for arg in args:
            if isinstance(arg, type) and issubclass(arg, ContractModel) and arg is not ContractModel:
                return arg
    if origin in (tuple, list, set, frozenset):
        for arg in args:
            if arg is not Ellipsis:
                if isinstance(arg, type) and issubclass(arg, ContractModel) and arg is not ContractModel:
                    return arg
    return None


def _resolve_scalar_type(ann: object) -> type | None:
    """Extract the terminal scalar type from an annotation, unwrapping collections."""
    if ann is None:
        return None
    origin = get_origin(ann)
    args = get_args(ann)
    if origin in (Union, UnionType):
        for arg in args:
            result = _resolve_scalar_type(arg)
            if result is not None:
                return result
        return None
    if origin in (tuple, list, set, frozenset):
        for arg in args:
            if arg is not Ellipsis:
                return _resolve_scalar_type(arg)
        return None
    if isinstance(ann, type):
        if issubclass(ann, ContractModel):
            return None  # terminal object → not scalar
        if ann in (str, int, float, bool, bytes):
            return ann
        from datetime import datetime
        from uuid import UUID
        if ann in (datetime, UUID):
            return ann
        return ann  # some other scalar
    return None


def _is_scalar_type(ann: object) -> bool:
    """Check if an annotation resolves to a scalar (not object/array)."""
    return _resolve_scalar_type(ann) is not None


def _is_non_bool_int(val: object) -> bool:
    """Check if a value is an int but not a bool."""
    return isinstance(val, int) and not isinstance(val, bool)


def _validate_path(
    payload_model: type[ContractModel],
    raw_path: str,
) -> list[str]:
    """Validate a wire-format path against a ContractModel.

    Returns a list of error messages (empty if the path is valid).
    The terminal must be a scalar type (not ``ContractModel``, ``dict``, or
    ``list``).  Nested ``ContractModel`` objects are traversed by wire alias.
    """
    errors: list[str] = []

    # Strip "payload." prefix (common in manifest paths)
    if raw_path.startswith("payload."):
        path = raw_path[len("payload."):]
    else:
        path = raw_path

    if not path:
        errors.append("Path is empty after stripping 'payload.' prefix")
        return errors

    segments = path.split(".")
    current_model: type[ContractModel] | None = payload_model

    for i, segment in enumerate(segments):
        if current_model is None:
            errors.append(f"Path '{raw_path}': cannot resolve '{segment}' — parent is not a ContractModel")
            break

        field_info = _find_field_by_alias(current_model, segment)
        if field_info is None:
            errors.append(
                f"Path '{raw_path}': field '{segment}' not found in "
                f"'{current_model.__name__}' (wire alias not found)"
            )
            break

        field_type = field_info.annotation
        is_last = (i == len(segments) - 1)

        if is_last:
            if not _is_scalar_type(field_type):
                errors.append(
                    f"Path '{raw_path}': terminal field '{segment}' in "
                    f"'{current_model.__name__}' is not a scalar type "
                    f"({field_type})"
                )
        else:
            nested = _resolve_contract_model(field_type)
            if nested is None:
                errors.append(
                    f"Path '{raw_path}': intermediate field '{segment}' in "
                    f"'{current_model.__name__}' is not a ContractModel "
                    f"({field_type})"
                )
                break
            current_model = nested

    return errors


def _check_contract(
    contract: MessageContract,
    violations: list[RegistryViolation],
) -> None:
    """Validate a single MessageContract for metadata completeness."""
    mt = contract.message_type
    sv = contract.schema_version

    # message_type
    if not mt:
        violations.append(
            RegistryViolation("empty_message_type", mt, sv, "message_type", "message_type must not be empty")
        )

    # schema_version
    if not _is_non_bool_int(sv) or sv < 1:
        violations.append(
            RegistryViolation("invalid_schema_version", mt, sv, "schema_version", f"schema_version must be int >= 1, got {sv!r}")
        )

    # topic
    if not contract.topic:
        violations.append(
            RegistryViolation("empty_topic", mt, sv, "topic", f"topic must not be empty")
        )

    # payload_model
    if not (isinstance(contract.payload_model, type) and issubclass(contract.payload_model, ContractModel)):
        violations.append(
            RegistryViolation("invalid_payload_model", mt, sv, "payload_model", "payload_model must be a subclass of ContractModel")
        )

    # producers
    if not contract.producers:
        violations.append(
            RegistryViolation("empty_producers", mt, sv, "producers", "producers must not be empty")
        )
    else:
        for producer in contract.producers:
            if not producer:
                violations.append(
                    RegistryViolation("empty_producer_name", mt, sv, "producers", f"producer name must not be empty")
                )

    # consumers
    if not contract.consumers:
        violations.append(
            RegistryViolation("empty_consumers", mt, sv, "consumers", "consumers must not be empty")
        )
    else:
        for consumer in contract.consumers:
            if not consumer:
                violations.append(
                    RegistryViolation("empty_consumer_name", mt, sv, "consumers", f"consumer name must not be empty")
                )

    # compatibility
    if contract.compatibility not in SUPPORTED_COMPATIBILITY:
        violations.append(
            RegistryViolation("unsupported_compatibility", mt, sv, "compatibility", f"unsupported compatibility: {contract.compatibility!r}")
        )

    # causation_policy
    if contract.causation_policy not in SUPPORTED_CAUSATION_POLICIES:
        violations.append(
            RegistryViolation("unsupported_causation_policy", mt, sv, "causation_policy", f"unsupported causation_policy: {contract.causation_policy!r}")
        )

    # partition_key
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
                path_errors = _validate_path(contract.payload_model, p)
                for err in path_errors:
                    violations.append(
                        RegistryViolation("invalid_partition_key_path", mt, sv, "partition_key.paths", err)
                    )

    # correlation_required + correlation_path
    if contract.correlation_required:
        if not contract.correlation_path:
            violations.append(
                RegistryViolation("missing_correlation_path", mt, sv, "correlation_path", "correlation_required=True requires correlation_path to be set")
            )
    if contract.correlation_path and isinstance(contract.payload_model, type) and issubclass(contract.payload_model, ContractModel):
        path_errors = _validate_path(contract.payload_model, contract.correlation_path)
        for err in path_errors:
            violations.append(
                RegistryViolation("invalid_correlation_path", mt, sv, "correlation_path", err)
            )


def validate_registry(
    catalog: ContractCatalog,
) -> tuple[RegistryViolation, ...]:
    """Validate all contracts in a catalog for metadata completeness.

    Returns all violations found (empty tuple means the registry is valid).
    """
    violations: list[RegistryViolation] = []

    for contract in catalog.contracts:
        _check_contract(contract, violations)

    return tuple(violations)