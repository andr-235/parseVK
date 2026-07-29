from __future__ import annotations

from typing import ClassVar


class ContractError(Exception):
    """Base error for all contract-related failures."""

    code: ClassVar[str] = "contract.error"


class InvalidEnvelopeError(ContractError):
    """Malformed envelope or unknown fields at envelope level."""

    code = "contract.invalid_envelope"


class UnknownContractError(ContractError):
    """message_type + schema_version not found in catalog."""

    code = "contract.unknown"


class DuplicateContractError(ContractError):
    """Duplicate contract identity in catalog."""

    code = "contract.duplicate"


class TopicMismatchError(ContractError):
    """Message received on unexpected topic."""

    code = "contract.topic_mismatch"


class ProducerNotAllowedError(ContractError):
    """Service is not listed as a producer for this contract."""

    code = "contract.producer_not_allowed"


class ConsumerNotAllowedError(ContractError):
    """Service is not listed as a consumer for this contract."""

    code = "contract.consumer_not_allowed"


class CorrelationPolicyError(ContractError):
    """Correlation policy violated (required/mismatch)."""

    code = "contract.correlation_policy"


class CausationPolicyError(ContractError):
    """Causation policy violated (required/forbidden)."""

    code = "contract.causation_policy"


class PartitionKeyError(ContractError):
    """Partition key computation failed."""

    code = "contract.partition_key"


class ContractValidationError(ContractError):
    """Payload validation failed (wraps Pydantic validation errors)."""

    code = "contract.validation_failed"
