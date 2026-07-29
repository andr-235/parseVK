from __future__ import annotations

from typing import Literal

from ._base import ContractModel
from .errors import (
    CausationPolicyError,
    ConsumerNotAllowedError,
    ContractValidationError,
    CorrelationPolicyError,
    PartitionKeyError,
    ProducerNotAllowedError,
    UnknownContractError,
)


class PartitionKeySpec:
    """Deterministic partition key specification.

    Computes a string key from dot-separated field paths on the payload.
    Composite keys join values with the configured separator.
    """

    def __init__(self, paths: tuple[str, ...], separator: str = ":") -> None:
        if not paths:
            raise ValueError("At least one path is required")
        self.paths = paths
        self.separator = separator

    def compute(self, payload: ContractModel) -> str:
        """Extract and join partition key values from payload."""
        parts: list[str] = []
        for path in self.paths:
            value = self._resolve_path(payload, path)
            parts.append(str(value))
        return self.separator.join(parts)

    def _resolve_path(self, obj: object, path: str) -> object:
        current = obj
        for segment in path.split("."):
            if segment == "payload":
                continue
            if isinstance(current, ContractModel):
                current = getattr(current, segment, None)
            elif isinstance(current, dict):
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


class MessageContract:
    """Definition of a single message contract.

    Immutable descriptor — not a runtime message instance.
    """

    def __init__(
        self,
        *,
        message_type: str,
        schema_version: int,
        payload_model: type[ContractModel],
        topic: str,
        producers: frozenset[str],
        consumers: frozenset[str],
        partition_key: PartitionKeySpec | None = None,
        correlation_required: bool = False,
        causation_policy: Literal["optional", "required", "forbidden"] = "optional",
        compatibility: Literal["backward"] = "backward",
    ) -> None:
        self.message_type = message_type
        self.schema_version = schema_version
        self.payload_model = payload_model
        self.topic = topic
        self.producers = producers
        self.consumers = consumers
        self.partition_key = partition_key
        self.correlation_required = correlation_required
        self.causation_policy = causation_policy
        self.compatibility = compatibility


class ContractCatalog:
    """Immutable registry of message contracts.

    Constructed via ``from_contracts()`` classmethod.
    Once built, the catalog cannot be modified.
    """

    def __init__(self, contracts: tuple[MessageContract, ...]) -> None:
        self._contracts = contracts
        self._by_type: dict[str, MessageContract] = {}
        self._by_topic: dict[str, list[MessageContract]] = {}

        for contract in contracts:
            key = f"{contract.message_type}:{contract.schema_version}"
            self._by_type[key] = contract
            if contract.topic not in self._by_topic:
                self._by_topic[contract.topic] = []
            self._by_topic[contract.topic].append(contract)

    @classmethod
    def from_contracts(cls, contracts: tuple[MessageContract, ...]) -> ContractCatalog:
        """Build an immutable catalog from a tuple of contracts."""
        return cls(contracts)

    def get(self, message_type: str, schema_version: int) -> MessageContract:
        """Look up a contract by message_type and schema_version."""
        key = f"{message_type}:{schema_version}"
        contract = self._by_type.get(key)
        if contract is None:
            raise UnknownContractError(
                f"Contract '{message_type}' v{schema_version} not found in catalog"
            )
        return contract

    def get_by_topic(self, topic: str) -> list[MessageContract]:
        """Get all contracts for a given topic."""
        return list(self._by_topic.get(topic, []))

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
    ) -> None:
        """Validate a message for consumption.

        Raises ContractError subclass on any violation.
        """
        contract = self.get(message_type, schema_version)

        if consumer not in contract.consumers:
            raise ConsumerNotAllowedError(
                f"Service '{consumer}' is not allowed to consume '{message_type}'"
            )

        self._validate_payload(contract, payload, extra="ignore")

    def _validate_payload(
        self,
        contract: MessageContract,
        payload: dict[str, object],
        extra: Literal["allow", "ignore", "forbid"],
    ) -> None:
        try:
            contract.payload_model.model_validate(payload, extra=extra)
        except Exception as exc:
            raise ContractValidationError(
                f"Payload validation failed for '{contract.message_type}': {exc}"
            ) from exc
