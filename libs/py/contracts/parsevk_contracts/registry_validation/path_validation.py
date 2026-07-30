from __future__ import annotations

from types import UnionType
from typing import Union, get_args, get_origin

from pydantic.fields import FieldInfo

from parsevk_contracts._base import ContractModel
from parsevk_contracts.registry_validation.models import RegistryViolation


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
    """Extract a ContractModel subclass from a type annotation if possible.

    Does NOT unwrap collection types (tuple, list, set, frozenset) — the
    path validator must reject traversal through collections since the
    runtime resolver does not support index or wildcard access.
    """
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
    return None


def _resolve_scalar_type(ann: object) -> type | None:
    """Extract the terminal scalar type from an annotation.

    Collection types (tuple, list, set, frozenset) are NOT unwrapped —
    a terminal collection is not a scalar value at the wire level
    (JSON array).
    """
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
        return None
    if isinstance(ann, type):
        if issubclass(ann, ContractModel):
            return None
        if ann in (str, int, float, bool, bytes):
            return ann
        from datetime import datetime
        from uuid import UUID
        if ann in (datetime, UUID):
            return ann
        return ann
    return None


def _is_scalar_type(ann: object) -> bool:
    """Check if an annotation resolves to a scalar (not object/array)."""
    return _resolve_scalar_type(ann) is not None


def validate_path(
    payload_model: type[ContractModel],
    raw_path: str,
) -> list[str]:
    """Validate a wire-format path against a ContractModel.

    Returns a list of error messages (empty if the path is valid).
    The terminal must be a scalar type (not ``ContractModel``, ``dict``, or
    ``list``).  Nested ``ContractModel`` objects are traversed by wire alias.
    """
    errors: list[str] = []

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
        origin = get_origin(field_type)
        is_last = (i == len(segments) - 1)
        is_collection = origin in (tuple, list, set, frozenset)

        if is_collection:
            if not is_last:
                errors.append(
                    f"Path '{raw_path}': intermediate field '{segment}' in "
                    f"'{current_model.__name__}' is a collection "
                    f"({field_type}) — runtime cannot traverse into arrays"
                )
            else:
                errors.append(
                    f"Path '{raw_path}': terminal field '{segment}' in "
                    f"'{current_model.__name__}' is a collection "
                    f"({field_type}) — partition/correlation value must be scalar"
                )
            break

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