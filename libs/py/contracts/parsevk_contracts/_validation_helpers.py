from __future__ import annotations

from types import UnionType
from typing import Union, cast, get_args, get_origin

from ._base import ContractModel
from .catalog import MessageContract, _resolve_wire_path
from .envelope import MessageEnvelope
from .errors import CausationPolicyError, CorrelationPolicyError


def resolve_contract_model(annotation: object) -> type[ContractModel] | None:
    if annotation is None:
        return None
    if (
        isinstance(annotation, type)
        and issubclass(annotation, ContractModel)
        and annotation is not ContractModel
    ):
        return annotation
    origin = get_origin(annotation)
    args = get_args(annotation)
    if origin in (Union, UnionType, tuple, list, set, frozenset):
        for arg in args:
            if arg is Ellipsis:
                continue
            if (
                isinstance(arg, type)
                and issubclass(arg, ContractModel)
                and arg is not ContractModel
            ):
                return arg
    return None


def reject_python_field_names(
    raw: dict[str, object],
    model: type[ContractModel],
    error_type: type[Exception],
    skip_recursion: set[str] | None = None,
) -> None:
    skipped = skip_recursion or set()
    for field_name, field_info in model.model_fields.items():
        alias = field_info.alias or field_name
        if field_name != alias and field_name in raw:
            raise error_type(
                f"Field '{field_name}' is internal; use '{alias}'"
            )
        if alias in skipped:
            continue
        nested = raw.get(alias)
        nested_model = resolve_contract_model(field_info.annotation)
        if nested_model is None:
            continue
        if isinstance(nested, dict):
            reject_python_field_names(nested, nested_model, error_type, skipped)
        elif isinstance(nested, (list, tuple)):
            for item in nested:
                if isinstance(item, dict):
                    reject_python_field_names(
                        item,
                        nested_model,
                        error_type,
                        skipped,
                    )


def envelope_type(
    payload_model: type[ContractModel],
) -> type[MessageEnvelope[ContractModel]]:
    return cast(
        type[MessageEnvelope[ContractModel]],
        MessageEnvelope[payload_model],  # type: ignore[valid-type]
    )


def enforce_envelope_policy(
    contract: MessageContract,
    envelope: MessageEnvelope[ContractModel],
) -> None:
    if contract.correlation_required and envelope.correlation_id is None:
        raise CorrelationPolicyError(
            f"correlationId is required for '{contract.message_type}'"
        )
    if contract.correlation_path and envelope.correlation_id is not None:
        expected = _resolve_wire_path(
            envelope.to_wire(),
            contract.correlation_path,
        )
        if str(envelope.correlation_id) != str(expected):
            raise CorrelationPolicyError(
                f"correlationId must match '{contract.correlation_path}': "
                f"got {envelope.correlation_id}, expected {expected}"
            )
    if contract.causation_policy == "required" and envelope.causation_id is None:
        raise CausationPolicyError(
            f"causationId is required for '{contract.message_type}'"
        )
    if contract.causation_policy == "forbidden" and envelope.causation_id is not None:
        raise CausationPolicyError(
            f"causationId is forbidden for '{contract.message_type}'"
        )
