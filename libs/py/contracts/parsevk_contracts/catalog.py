"""Contract catalog - immutable registry of message contracts."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass, field
from types import MappingProxyType
from typing import Any, Literal

from ._base import ContractModel
from .errors import (
    DuplicateContractError,
    PartitionKeyError,
    UnknownContractError,
)


@dataclass(frozen=True, slots=True)
class PartitionKeySpec:
    """Deterministic partition key specification.

    Paths use dot-separated wire-format (camelCase) field names.
    Composite keys join values with the configured separator.
    """

    paths: tuple[str, ...]
    separator: str = ":"

    def __post_init__(self) -> None:
        if not self.paths:
            raise ValueError("At least one path is required")
        for path in self.paths:
            if not path:
                raise ValueError("Path must not be empty")
        if not isinstance(self.separator, str) or not self.separator:
            raise ValueError("Separator must be a non-empty string")

    def compute(self, payload: ContractModel) -> str:
        wire = payload.to_wire()
        adjusted_paths = tuple(self._strip_payload_prefix(path) for path in self.paths)
        return self._compute_from_wire(wire, adjusted_paths)

    def compute_from_wire(self, wire_data: dict[str, object]) -> str:
        return self._compute_from_wire(wire_data, self.paths)

    @staticmethod
    def _strip_payload_prefix(path: str) -> str:
        if path.startswith("payload."):
            return path[len("payload."):]
        return path

    def _compute_from_wire(
        self, wire_data: dict[str, object], paths: tuple[str, ...]
    ) -> str:
        parts: list[str] = []
        for path in paths:
            value = _resolve_wire_path(wire_data, path)
            if value is None:
                raise PartitionKeyError(f"Path '{path}' resolved to None")
            if isinstance(value, (dict, list)):
                raise PartitionKeyError(
                    f"Path '{path}' resolved to {type(value).__name__}, expected scalar"
                )
            part = str(value)
            if not part:
                raise PartitionKeyError(f"Path '{path}' resolved to empty value")
            parts.append(part)
        return self.separator.join(parts)


def _resolve_wire_path(data: dict[str, object], path: str) -> object:
    current: Any = data
    for segment in path.split("."):
        if not segment:
            raise PartitionKeyError(f"Empty segment in path '{path}'")
        if isinstance(current, dict):
            current = current.get(segment)
        else:
            raise PartitionKeyError(
                f"Cannot resolve path '{path}' at segment '{segment}'"
            )
        if current is None:
            raise PartitionKeyError(
                f"Path '{path}' resolved to None at segment '{segment}'"
            )
    return current


@dataclass(frozen=True, slots=True)
class MessageContract:
    """Definition of a single immutable message contract."""

    message_type: str
    schema_version: int
    payload_model: type[ContractModel]
    topic: str
    producers: frozenset[str]
    consumers: frozenset[str]
    partition_key: PartitionKeySpec | None = None
    correlation_required: bool = False
    correlation_path: str | None = None
    causation_policy: Literal["optional", "required", "forbidden"] = "optional"
    compatibility: Literal["backward", "none"] = "backward"


@dataclass(frozen=True, slots=True)
class ContractCatalog:
    """Immutable registry of message contracts."""

    contracts: tuple[MessageContract, ...]
    _by_identity: Mapping[tuple[str, int], MessageContract] = field(init=False, repr=False)
    _by_topic: Mapping[str, tuple[MessageContract, ...]] = field(init=False, repr=False)

    def __post_init__(self) -> None:
        by_identity: dict[tuple[str, int], MessageContract] = {}
        by_topic: dict[str, tuple[MessageContract, ...]] = {}

        for contract in self.contracts:
            key = (contract.message_type, contract.schema_version)
            if key in by_identity:
                raise DuplicateContractError(
                    f"Duplicate contract '{contract.message_type}' v{contract.schema_version}"
                )
            by_identity[key] = contract
            topic_list = by_topic.setdefault(contract.topic, ())
            by_topic[contract.topic] = topic_list + (contract,)

        object.__setattr__(self, "_by_identity", MappingProxyType(by_identity))
        object.__setattr__(self, "_by_topic", MappingProxyType(by_topic))

    @classmethod
    def from_contracts(cls, contracts: tuple[MessageContract, ...]) -> ContractCatalog:
        return cls(contracts=contracts)

    def get(self, message_type: str, schema_version: int) -> MessageContract:
        key = (message_type, schema_version)
        contract = self._by_identity.get(key)
        if contract is None:
            raise UnknownContractError(
                f"Contract '{message_type}' v{schema_version} not found in catalog"
            )
        return contract

    def get_by_topic(self, topic: str) -> tuple[MessageContract, ...]:
        return self._by_topic.get(topic, ())
