"""Tests for source access events and VK resolver payloads."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID, uuid4

import pytest
from pydantic import ValidationError

from parsevk_contracts.errors import ConsumerNotAllowedError, ProducerNotAllowedError
from parsevk_contracts.sources import SOURCES_CATALOG
from parsevk_contracts.sources.events import (
    SOURCE_ACCESS_GRANTED,
    SOURCE_ACCESS_REVOKED,
    SourceAccessGranted,
    SourceAccessRevoked,
)
from parsevk_contracts.validation import parse_for_consume, prepare_for_publish
from parsevk_contracts.vk.commands import SourceReference
from parsevk_contracts.vk.resolver import VkSourceResolverRequest, VkSourceResolverResponse


def make_grant_payload(**overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "source_id": uuid4(),
        "provider": "vk",
        "source_type": "community",
        "external_id": "123",
        "owner_id": -123,
        "access_scope_id": uuid4(),
        "created_by_user_id": uuid4(),
        "revision": 1,
    }
    payload.update(overrides)
    return payload


def prepare(message_type: str, payload: dict[str, object]):
    return prepare_for_publish(
        SOURCES_CATALOG,
        message_type=message_type,
        producer="tasks-service",
        message_id=uuid4(),
        occurred_at=datetime.now(UTC),
        payload=payload,
    )


class TestSourceAccessPayloads:
    def test_valid_grant_and_revoke(self) -> None:
        assert SourceAccessGranted(**make_grant_payload()).revision == 1
        assert SourceAccessRevoked(**make_grant_payload()).source_type == "community"

    def test_owner_identity_must_match(self) -> None:
        with pytest.raises(ValidationError, match="ownerId must equal"):
            SourceAccessGranted(**make_grant_payload(external_id="456", owner_id=-999))
        with pytest.raises(ValidationError):
            SourceAccessGranted(**make_grant_payload(owner_id=123))

    def test_scope_and_creator_must_differ(self) -> None:
        same_id = uuid4()
        with pytest.raises(ValidationError, match="createdByUserId must differ"):
            SourceAccessGranted(
                **make_grant_payload(
                    access_scope_id=same_id,
                    created_by_user_id=same_id,
                )
            )

    def test_negative_revision_is_rejected(self) -> None:
        with pytest.raises(ValidationError):
            SourceAccessGranted(**make_grant_payload(revision=-1))


class TestSourceAccessBoundary:
    def test_publish_grant_and_revoke(self) -> None:
        grant = prepare("sources.access.granted", make_grant_payload())
        revoke = prepare("sources.access.revoked", make_grant_payload())
        assert grant.topic == revoke.topic == "parsevk.sources.events"
        assert isinstance(grant.envelope.payload, SourceAccessGranted)
        assert isinstance(revoke.envelope.payload, SourceAccessRevoked)
        assert "schemaVersion" not in grant.envelope.to_wire()

    def test_producer_whitelist(self) -> None:
        with pytest.raises(ProducerNotAllowedError):
            prepare_for_publish(
                SOURCES_CATALOG,
                message_type="sources.access.granted",
                producer="vk-service",
                message_id=uuid4(),
                occurred_at=datetime.now(UTC),
                payload=make_grant_payload(),
            )

    def test_consumer_whitelist(self) -> None:
        prepared = prepare("sources.access.granted", make_grant_payload())
        parsed = parse_for_consume(
            SOURCES_CATALOG,
            consumer="vk-service",
            topic=prepared.topic,
            value=prepared.value,
        )
        assert isinstance(parsed.envelope.payload, SourceAccessGranted)
        with pytest.raises(ConsumerNotAllowedError):
            parse_for_consume(
                SOURCES_CATALOG,
                consumer="content-service",
                topic=prepared.topic,
                value=prepared.value,
            )


class TestPartitionKey:
    @pytest.mark.parametrize(
        ("contract", "payload_type"),
        (
            (SOURCE_ACCESS_GRANTED, SourceAccessGranted),
            (SOURCE_ACCESS_REVOKED, SourceAccessRevoked),
        ),
    )
    def test_partition_key_is_source_id(self, contract, payload_type) -> None:
        payload = payload_type(**make_grant_payload())
        assert contract.partition_key is not None
        assert contract.partition_key.compute(payload) == str(payload.source_id)


class TestSourceCatalog:
    def test_semantic_types_are_registered_once(self) -> None:
        assert SOURCES_CATALOG.get("sources.access.granted") is SOURCE_ACCESS_GRANTED
        assert SOURCES_CATALOG.get("sources.access.revoked") is SOURCE_ACCESS_REVOKED
        assert len(SOURCES_CATALOG.contracts) == 2

    def test_producers_consumers(self) -> None:
        for contract in SOURCES_CATALOG.contracts:
            assert contract.producers == frozenset({"tasks-service"})
            assert contract.consumers == frozenset({"vk-service"})
            assert not hasattr(contract, "compatibility")


class TestVkSourceResolverContract:
    def test_request_validation(self) -> None:
        request = VkSourceResolverRequest(
            provider="vk",
            source_type="community",
            external_id="123",
        )
        assert request.external_id == "123"
        with pytest.raises(ValidationError):
            VkSourceResolverRequest(
                provider="vk",
                source_type="community",
                external_id="0",
            )

    def test_response_round_trip(self) -> None:
        source_id = uuid4()
        response = VkSourceResolverResponse(
            source=SourceReference(
                source_id=source_id,
                provider="vk",
                source_type="community",
                external_id="456",
                owner_id=-456,
            ),
            access_scope_id=uuid4(),
            source_revision=3,
            access_scope_revision=2,
        )
        wire = response.to_wire()
        assert wire["source"]["externalId"] == "456"
        assert wire["source"]["ownerId"] == -456
        parsed = VkSourceResolverResponse.model_validate_json(response.to_wire_json())
        assert parsed == response
        assert isinstance(parsed.source.source_id, UUID)
