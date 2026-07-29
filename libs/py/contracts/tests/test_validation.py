"""Tests for validation convenience functions."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4

import pytest

from parsevk_contracts._base import ContractModel
from parsevk_contracts.catalog import ContractCatalog, MessageContract, PartitionKeySpec
from parsevk_contracts.envelope import MessageEnvelope
from parsevk_contracts.errors import (
    ConsumerNotAllowedError,
    ContractValidationError,
    CorrelationPolicyError,
    ProducerNotAllowedError,
    UnknownContractError,
)
from parsevk_contracts.validation import validate_for_consume, validate_for_publish


class SamplePayload(ContractModel):
    entity_id: str
    value: int


@pytest.fixture
def contract() -> MessageContract:
    return MessageContract(
        message_type="test.event",
        schema_version=1,
        payload_model=SamplePayload,
        topic="test.topic",
        producers=frozenset({"producer-a"}),
        consumers=frozenset({"consumer-b"}),
        partition_key=PartitionKeySpec(paths=("entity_id",)),
        correlation_required=True,
        causation_policy="optional",
    )


@pytest.fixture
def catalog(contract: MessageContract) -> ContractCatalog:
    return ContractCatalog.from_contracts((contract,))


_SENTINEL = object()


def make_envelope(
    payload: SamplePayload | None = None,
    correlation_id: UUID | None | object = _SENTINEL,
    message_type: str = "test.event",
) -> MessageEnvelope[SamplePayload]:
    if payload is None:
        payload = SamplePayload(entity_id="abc", value=1)

    if correlation_id is _SENTINEL:
        corr_uuid: UUID | None = uuid4()
    else:
        corr_uuid = correlation_id  # type: ignore[assignment]

    return MessageEnvelope[SamplePayload](
        message_id=uuid4(),
        message_type=message_type,
        schema_version=1,
        occurred_at=datetime.now(timezone.utc),
        producer="producer-a",
        correlation_id=corr_uuid,
        payload=payload,
    )


class TestValidateForPublish:
    def test_valid_publish(self, catalog: ContractCatalog) -> None:
        """Valid envelope passes publish validation."""
        envelope = make_envelope()
        validate_for_publish(catalog, envelope, producer="producer-a")

    def test_unknown_contract(self, catalog: ContractCatalog) -> None:
        """Unknown message_type raises UnknownContractError."""
        envelope = make_envelope(message_type="unknown.event")
        with pytest.raises(UnknownContractError):
            validate_for_publish(catalog, envelope, producer="producer-a")

    def test_producer_not_allowed(self, catalog: ContractCatalog) -> None:
        """Unauthorized producer raises ProducerNotAllowedError."""
        envelope = make_envelope()
        with pytest.raises(ProducerNotAllowedError):
            validate_for_publish(catalog, envelope, producer="unauthorized")

    def test_missing_correlation(self, catalog: ContractCatalog) -> None:
        """Missing correlation_id raises CorrelationPolicyError."""
        envelope = make_envelope(correlation_id=None)
        with pytest.raises(CorrelationPolicyError):
            validate_for_publish(catalog, envelope, producer="producer-a")


class TestValidateForConsume:
    def test_valid_consume(self, catalog: ContractCatalog) -> None:
        """Valid envelope passes consume validation."""
        envelope = make_envelope()
        validate_for_consume(catalog, envelope, consumer="consumer-b")

    def test_consumer_not_allowed(self, catalog: ContractCatalog) -> None:
        """Unauthorized consumer raises ConsumerNotAllowedError."""
        envelope = make_envelope()
        with pytest.raises(ConsumerNotAllowedError):
            validate_for_consume(catalog, envelope, consumer="unauthorized")

    def test_unknown_contract(self, catalog: ContractCatalog) -> None:
        """Unknown message_type raises UnknownContractError."""
        envelope = make_envelope(message_type="unknown.event")
        with pytest.raises(UnknownContractError):
            validate_for_consume(catalog, envelope, consumer="consumer-b")
