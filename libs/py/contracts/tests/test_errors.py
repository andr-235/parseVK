"""Tests for ContractError hierarchy."""

from __future__ import annotations

from parsevk_contracts.errors import (
    CausationPolicyError,
    ConsumerNotAllowedError,
    ContractError,
    ContractValidationError,
    CorrelationPolicyError,
    InvalidEnvelopeError,
    PartitionKeyError,
    ProducerNotAllowedError,
    UnknownContractError,
)


class TestContractErrorHierarchy:
    def test_all_errors_inherit_contract_error(self) -> None:
        """All custom errors inherit from ContractError."""
        assert issubclass(InvalidEnvelopeError, ContractError)
        assert issubclass(UnknownContractError, ContractError)
        assert issubclass(ProducerNotAllowedError, ContractError)
        assert issubclass(ConsumerNotAllowedError, ContractError)
        assert issubclass(CorrelationPolicyError, ContractError)
        assert issubclass(CausationPolicyError, ContractError)
        assert issubclass(PartitionKeyError, ContractError)
        assert issubclass(ContractValidationError, ContractError)

    def test_contract_error_is_exception(self) -> None:
        """ContractError inherits from Exception."""
        assert issubclass(ContractError, Exception)

    def test_isinstance_checks(self) -> None:
        """isinstance works correctly for all error types."""
        assert isinstance(InvalidEnvelopeError("msg"), ContractError)
        assert isinstance(UnknownContractError("msg"), ContractError)
        assert isinstance(ProducerNotAllowedError("msg"), ContractError)
        assert isinstance(ConsumerNotAllowedError("msg"), ContractError)
        assert isinstance(CorrelationPolicyError("msg"), ContractError)
        assert isinstance(CausationPolicyError("msg"), ContractError)
        assert isinstance(PartitionKeyError("msg"), ContractError)
        assert isinstance(ContractValidationError("msg"), ContractError)

    def test_error_message(self) -> None:
        """Error message is preserved."""
        msg = "test error message"
        err = ContractValidationError(msg)
        assert str(err) == msg

    def test_caught_as_base_exception(self) -> None:
        """ContractError can be caught as Exception."""
        try:
            raise UnknownContractError("not found")
        except Exception as exc:
            assert isinstance(exc, UnknownContractError)
