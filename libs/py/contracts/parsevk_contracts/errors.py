from __future__ import annotations


class ContractError(Exception):
    """Base error for all contract-related failures."""


class InvalidEnvelopeError(ContractError):
    """Malformed envelope or unknown fields at envelope level."""


class UnknownContractError(ContractError):
    """message_type + schema_version not found in catalog."""


class ProducerNotAllowedError(ContractError):
    """Service is not listed as a producer for this contract."""


class ConsumerNotAllowedError(ContractError):
    """Service is not listed as a consumer for this contract."""


class CorrelationPolicyError(ContractError):
    """Correlation ID is required but missing."""


class CausationPolicyError(ContractError):
    """Causation policy violated (required/forbidden)."""


class PartitionKeyError(ContractError):
    """Partition key computation failed."""


class ContractValidationError(ContractError):
    """Payload validation failed (wraps Pydantic validation errors)."""
