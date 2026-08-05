from __future__ import annotations

from typing import ClassVar


class ContractError(Exception):
    code: ClassVar[str] = "contract.error"


class InvalidEnvelopeError(ContractError):
    code = "contract.invalid_envelope"


class UnknownContractError(ContractError):
    """Semantic message type is not registered."""

    code = "contract.unknown"


class DuplicateContractError(ContractError):
    """Semantic message type is registered more than once."""

    code = "contract.duplicate"


class TopicMismatchError(ContractError):
    code = "contract.topic_mismatch"


class ProducerNotAllowedError(ContractError):
    code = "contract.producer_not_allowed"


class ConsumerNotAllowedError(ContractError):
    code = "contract.consumer_not_allowed"


class CorrelationPolicyError(ContractError):
    code = "contract.correlation_policy"


class CausationPolicyError(ContractError):
    code = "contract.causation_policy"


class PartitionKeyError(ContractError):
    code = "contract.partition_key"


class ContractValidationError(ContractError):
    code = "contract.validation_failed"
