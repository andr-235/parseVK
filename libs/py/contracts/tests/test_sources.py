"""Tests for source access change contracts and the VK resolver contract."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID, uuid4

import pytest
from pydantic import ValidationError

from parsevk_contracts.errors import (
    ConsumerNotAllowedError,
    ProducerNotAllowedError,
    UnknownContractError,
)
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
    base: dict[str, object] = {
        "source_id": uuid4(),
        "provider": "vk",
        "source_type": "community",
        "external_id": "123",
        "owner_id": -123,
        "access_scope_id": uuid4(),
        "created_by_user_id": uuid4(),
        "revision": 1,
    }
    base.update(overrides)
    return base


def make_revoke_payload(**overrides: object) -> dict[str, object]:
    return make_grant_payload(**overrides)


class TestSourceAccessPayloads:
    def test_valid_grant(self) -> None:
        """Valid grant payload passes construction."""
        payload = SourceAccessGranted(**make_grant_payload())
        assert payload.provider == "vk"
        assert payload.revision == 1

    def test_valid_revoke(self) -> None:
        """Valid revoke payload passes construction."""
        payload = SourceAccessRevoked(**make_revoke_payload())
        assert payload.source_type == "community"

    def test_owner_id_mismatch(self) -> None:
        """ownerId must equal negative externalId (contract invariant)."""
        with pytest.raises(ValidationError, match="ownerId must equal"):
            SourceAccessGranted(**make_grant_payload(external_id="456", owner_id=-999))

    def test_positive_owner_id(self) -> None:
        """Positive ownerId is rejected."""
        with pytest.raises(ValidationError):
            SourceAccessGranted(**make_grant_payload(owner_id=123))

    def test_scope_user_separation(self) -> None:
        """accessScopeId and createdByUserId must be separate values."""
        same_id = uuid4()
        with pytest.raises(ValidationError, match="createdByUserId must differ"):
            SourceAccessGranted(
                **make_grant_payload(
                    access_scope_id=same_id,
                    created_by_user_id=same_id,
                )
            )

    def test_negative_revision(self) -> None:
        """Revision must be >= 0."""
        with pytest.raises(ValidationError):
            SourceAccessGranted(**make_grant_payload(revision=-1))

    def test_unknown_schema_version(self) -> None:
        """Unknown schemaVersion is rejected at the boundary."""
        data = make_grant_payload()
        with pytest.raises(UnknownContractError):
            prepare_for_publish(
                SOURCES_CATALOG,
                message_type="sources.access.granted",
                schema_version=99,
                producer="tasks-service",
                message_id=uuid4(),
                occurred_at=datetime.now(UTC),
                correlation_id=None,
                causation_id=None,
                payload=data,
            )


class TestSourceAccessBoundary:
    def test_publish_grant(self) -> None:
        """prepare_for_publish accepts a valid grant from tasks-service."""
        result = prepare_for_publish(
            SOURCES_CATALOG,
            message_type="sources.access.granted",
            schema_version=1,
            producer="tasks-service",
            message_id=uuid4(),
            occurred_at=datetime.now(UTC),
            correlation_id=None,
            causation_id=None,
            payload=make_grant_payload(),
        )
        assert result.topic == "parsevk.sources.events"
        assert isinstance(result.envelope.payload, SourceAccessGranted)

    def test_publish_revoke(self) -> None:
        """prepare_for_publish accepts a valid revoke from tasks-service."""
        result = prepare_for_publish(
            SOURCES_CATALOG,
            message_type="sources.access.revoked",
            schema_version=1,
            producer="tasks-service",
            message_id=uuid4(),
            occurred_at=datetime.now(UTC),
            correlation_id=None,
            causation_id=None,
            payload=make_revoke_payload(),
        )
        assert result.topic == "parsevk.sources.events"
        assert isinstance(result.envelope.payload, SourceAccessRevoked)

    def test_producer_whitelist(self) -> None:
        """Only tasks-service may publish source access events."""
        for message_type in ("sources.access.granted", "sources.access.revoked"):
            with pytest.raises(ProducerNotAllowedError):
                prepare_for_publish(
                    SOURCES_CATALOG,
                    message_type=message_type,
                    schema_version=1,
                    producer="vk-service",
                    message_id=uuid4(),
                    occurred_at=datetime.now(UTC),
                    correlation_id=None,
                    causation_id=None,
                    payload=make_grant_payload(),
                )

    def test_consumer_whitelist(self) -> None:
        """Declared consumer may parse; others are rejected."""
        payload = make_grant_payload()
        prepared = prepare_for_publish(
            SOURCES_CATALOG,
            message_type="sources.access.granted",
            schema_version=1,
            producer="tasks-service",
            message_id=uuid4(),
            occurred_at=datetime.now(UTC),
            correlation_id=None,
            causation_id=None,
            payload=payload,
        )
        parsed = parse_for_consume(
            SOURCES_CATALOG,
            consumer="vk-service",
            topic="parsevk.sources.events",
            value=prepared.value,
        )
        assert isinstance(parsed.envelope.payload, SourceAccessGranted)

        with pytest.raises(ConsumerNotAllowedError):
            parse_for_consume(
                SOURCES_CATALOG,
                consumer="content-service",
                topic="parsevk.sources.events",
                value=prepared.value,
            )


class TestPartitionKey:
    def test_partition_key_by_source_id(self) -> None:
        """Partition key is the sourceId."""
        payload = SourceAccessGranted(**make_grant_payload())
        key = SOURCE_ACCESS_GRANTED.partition_key
        assert key is not None
        assert key.compute(payload) == str(payload.source_id)

    def test_partition_key_deterministic(self) -> None:
        """Same payload always produces the same partition key."""
        payload = SourceAccessGranted(**make_grant_payload())
        key = SOURCE_ACCESS_GRANTED.partition_key
        assert key is not None
        assert key.compute(payload) == key.compute(payload)

    def test_revoke_partition_key(self) -> None:
        """Revoke events use the same sourceId key."""
        payload = SourceAccessRevoked(**make_revoke_payload())
        key = SOURCE_ACCESS_REVOKED.partition_key
        assert key is not None
        assert key.compute(payload) == str(payload.source_id)


class TestSourceCatalog:
    def test_both_contracts_registered(self) -> None:
        """Both source access contracts are registered in the sources catalog."""
        granted = SOURCES_CATALOG.get("sources.access.granted", 1)
        revoked = SOURCES_CATALOG.get("sources.access.revoked", 1)
        assert granted is SOURCE_ACCESS_GRANTED
        assert revoked is SOURCE_ACCESS_REVOKED
        assert granted.topic == "parsevk.sources.events"
        assert revoked.topic == "parsevk.sources.events"

    def test_producers_consumers(self) -> None:
        """tasks-service produces; vk-service is the declared future consumer."""
        for contract in (SOURCE_ACCESS_GRANTED, SOURCE_ACCESS_REVOKED):
            assert contract.producers == frozenset({"tasks-service"})
            assert contract.consumers == frozenset({"vk-service"})

    def test_additive_compatibility(self) -> None:
        """Both contracts declare backward compatibility."""
        assert SOURCE_ACCESS_GRANTED.compatibility == "backward"
        assert SOURCE_ACCESS_REVOKED.compatibility == "backward"


class TestVkSourceResolverContract:
    def test_request_valid(self) -> None:
        """Valid normalized identity passes construction."""
        req = VkSourceResolverRequest(
            provider="vk",
            source_type="community",
            external_id="123",
        )
        assert req.external_id == "123"

    def test_request_rejects_zero_external_id(self) -> None:
        """Zero externalId is rejected."""
        with pytest.raises(ValidationError):
            VkSourceResolverRequest(
                provider="vk",
                source_type="community",
                external_id="0",
            )

    def test_response_reuses_source_reference(self) -> None:
        """Response reuses SourceReference instead of duplicating identity fields."""
        source_id = uuid4()
        resp = VkSourceResolverResponse(
            source=SourceReference(
                source_id=source_id,
                provider="vk",
                source_type="community",
                external_id="123",
                owner_id=-123,
            ),
            access_scope_id=uuid4(),
            source_revision=2,
            access_scope_revision=1,
        )
        assert resp.source.source_id == source_id
        assert resp.source.owner_id == -123

    def test_response_wire_format(self) -> None:
        """Response serializes to camelCase wire format with nested source."""
        resp = VkSourceResolverResponse(
            source=SourceReference(
                source_id=uuid4(),
                provider="vk",
                source_type="community",
                external_id="456",
                owner_id=-456,
            ),
            access_scope_id=uuid4(),
            source_revision=0,
            access_scope_revision=0,
        )
        wire = resp.to_wire()
        assert "accessScopeId" in wire
        assert "sourceRevision" in wire
        assert wire["source"]["externalId"] == "456"
        assert wire["source"]["ownerId"] == -456

    def test_response_envelope_round_trip(self) -> None:
        """Resolver response round-trips through the envelope."""
        resp = VkSourceResolverResponse(
            source=SourceReference(
                source_id=uuid4(),
                provider="vk",
                source_type="community",
                external_id="123",
                owner_id=-123,
            ),
            access_scope_id=uuid4(),
            source_revision=3,
            access_scope_revision=2,
        )
        wire = resp.to_wire_json()
        parsed = VkSourceResolverResponse.model_validate_json(wire)
        assert parsed == resp
        assert isinstance(parsed.source.source_id, UUID)
