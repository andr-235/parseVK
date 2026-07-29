"""Contract catalog - immutable registry of message contracts."""

from __future__ import annotations

from dataclasses import dataclass
from types import MappingProxyType
from typing import Any, Literal

from ._base import ContractModel
from .errors import (
    CausationPolicyError,
    ConsumerNotAllowedError,
    ContractValidationError,
    CorrelationPolicyError,
    DuplicateContractError,
    PartitionKeyError,
    ProducerNotAllowedError,
    UnknownContractError,
)


@dataclass(frozen=True)
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

    def compute(self, payload: ContractModel) -> str:
        """Compute partition key from payload model.

        The path is defined in envelope-wire format (e.g. ``"payload.executionId"``).
        This method strips the ``"payload."`` prefix and resolves the remaining path
        against the payload's own wire dict.
        """
        wire = payload.to_wire()
        adjusted_paths = tuple(
            self._strip_payload_prefix(p) for p in self.paths
        )
        return self._compute_from_wire(wire, adjusted_paths)

    def compute_from_wire(self, wire_data: dict[str, object]) -> str:
        """Compute partition key from any wire-format dict (envelope or payload level)."""
        return self._compute_from_wire(wire_data, self.paths)

    @staticmethod
    def _strip_payload_prefix(path: str) -> str:
        """Strip ``'payload.'`` prefix if present for payload-level resolution."""
        if path.startswith("payload."):
            return path[len("payload."):]
        return path

    @staticmethod
    def _compute_from_wire(
        wire_data: dict[str, object], paths: tuple[str, ...]
    ) -> str:
        """Internal: resolve paths against wire dict and join with separator."""
        parts: list[str] = []
        for path in paths:
            value = _resolve_wire_path(wire_data, path)
            parts.append(str(value))
        return ":".join(parts)


def _resolve_wire_path(data: dict[str, object], path: str) -> object:
    """Traverse a wire-format dict by dot-separated path."""
    current: Any = data
    for segment in path.split("."):
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


@dataclass(frozen=True)
class MessageContract:
    """Definition of a single message contract.

    Immutable descriptor — not a runtime message instance.
    """

    message_type: str
    schema_version: int
    payload_model: type[ContractModel]
    topic: str
    producers: frozenset[str]
    consumers: frozenset[str]
    partition_key: PartitionKeySpec | None = None
    correlation_required: bool = False
    causation_policy: Literal["optional", "required", "forbidden"] = "optional"
    compatibility: Literal["backward"] = "backward"


class ContractCatalog:
    """Immutable registry of message contracts.

    Constructed via ``from_contracts()`` classmethod.
    Once built, the catalog and its contents cannot be modified.
    """

    def __init__(self, contracts: tuple[MessageContract, ...]) -> None:
        self._contracts = contracts
        by_type: dict[str, MessageContract] = {}
        by_topic: dict[str, list[MessageContract]] = {}

        for contract in contracts:
            key = f"{contract.message_type}:{contract.schema_version}"
            if key in by_type:
                raise DuplicateContractError(
                    f"Duplicate contract '{contract.message_type}' "
                    f"v{contract.schema_version}"
                )
            by_type[key] = contract
            if contract.topic not in by_topic:
                by_topic[contract.topic] = []
            by_topic[contract.topic].append(contract)

        self._by_identity = MappingProxyType(by_type)
        self._by_topic = MappingProxyType(
            {topic: tuple(c) for topic, c in by_topic.items()}
        )

    @classmethod
    def from_contracts(cls, contracts: tuple[MessageContract, ...]) -> ContractCatalog:
        """Build an immutable catalog from a tuple of contracts."""
        return cls(contracts)

    @property
    def contracts(self) -> tuple[MessageContract, ...]:
        """Immutable tuple of all registered contracts."""
        return self._contracts

    def get(self, message_type: str, schema_version: int) -> MessageContract:
        """Look up a contract by message_type and schema_version.

        Raises UnknownContractError if not found.
        """
        key = f"{message_type}:{schema_version}"
        contract = self._by_identity.get(key)
        if contract is None:
            raise UnknownContractError(
                f"Contract '{message_type}' v{schema_version} not found in catalog"
            )
        return contract

    def get_by_topic(self, topic: str) -> tuple[MessageContract, ...]:
        """Get all contracts for a given topic."""
        return self._by_topic.get(topic, ())

    def validate_for_publish(
        self,
        message_type: str,
        schema_version: int,
        producer: str,
        payload: dict[str, object],
        correlation_id: str | None = None,
        causation_id: str | None = None,
    ) -> None:
        """Validate a message for publishing.

        Raises ContractError subclass on any violation.
        """
        contract = self.get(message_type, schema_version)

        if producer not in contract.producers:
            raise ProducerNotAllowedError(
                f"Service '{producer}' is not allowed to publish '{message_type}'"
            )

        if contract.correlation_required and correlation_id is None:
            raise CorrelationPolicyError(
                f"Correlation ID is required for '{message_type}'"
            )

        if contract.causation_policy == "required" and causation_id is None:
            raise CausationPolicyError(
                f"Causation ID is required for '{message_type}'"
            )
        if contract.causation_policy == "forbidden" and causation_id is not None:
            raise CausationPolicyError(
                f"Causation ID is forbidden for '{message_type}'"
            )

        self._validate_payload(contract, payload, extra="forbid")

    def validate_for_consume(
        self,
        message_type: str,
        schema_version: int,
        consumer: str,
        payload: dict[str, object],
        correlation_id: str | None = None,
        causation_id: str | None = None,
    ) -> None:
        """Validate a message for consumption.

        Raises ContractError subclass on any violation.
        """
        contract = self.get(message_type, schema_version)

        if consumer not in contract.consumers:
            raise ConsumerNotAllowedError(
                f"Service '{consumer}' is not allowed to consume '{message_type}'"
            )

        if contract.correlation_required and correlation_id is None:
            raise CorrelationPolicyError(
                f"Correlation ID is required for '{message_type}'"
            )

        if contract.causation_policy == "required" and causation_id is None:
            raise CausationPolicyError(
                f"Causation ID is required for '{message_type}'"
            )
        if contract.causation_policy == "forbidden" and causation_id is not None:
            raise CausationPolicyError(
                f"Causation ID is forbidden for '{message_type}'"
            )

        self._validate_payload(contract, payload, extra="ignore")

    def _validate_payload(
        self,
        contract: MessageContract,
        payload: dict[str, object],
        extra: str,
    ) -> None:
        try:
            contract.payload_model.model_validate(payload, extra=extra)
        except Exception as exc:
            raise ContractValidationError(
                f"Payload validation failed for '{contract.message_type}': {exc}"
            ) from exc
