from typing import Any

from common.events import WireEvent
from pydantic import ValidationError

from app.domain.entities.ingestion_part_identity import IngestionPartVersions
from app.domain.entities.ingestion_part_publication import (
    IngestionPartPublicationClaim,
)
from app.domain.repositories.ingestion_part_publication import (
    IngestionPartPublicationIntegrityError,
)


def verify_publication_claim(
    claim: IngestionPartPublicationClaim,
    *,
    supported_versions: IngestionPartVersions = IngestionPartVersions(),
) -> IngestionPartPublicationClaim:
    try:
        verified = claim.verified_copy()
        if verified.part.versions != supported_versions:
            raise ValueError("unsupported ingestion part version tuple")
        wire = WireEvent.model_validate_json(verified.part.wire_bytes)
        _verify_envelope(verified, wire)
        _verify_payload(verified, wire.payload)
        return verified
    except (ValueError, ValidationError, TypeError, KeyError) as error:
        raise IngestionPartPublicationIntegrityError(str(error)) from error


def _verify_envelope(
    claim: IngestionPartPublicationClaim,
    wire: WireEvent,
) -> None:
    expected = {
        "event_id": claim.event_id,
        "event_type": claim.event_type,
        "event_version": claim.part.versions.event_contract,
        "aggregate_type": "vk_ingestion_batch",
        "aggregate_id": str(claim.batch.batch_id),
    }
    actual = {
        "event_id": wire.event_id,
        "event_type": wire.event_type,
        "event_version": wire.event_version,
        "aggregate_type": wire.aggregate_type,
        "aggregate_id": wire.aggregate_id,
    }
    if actual != expected:
        raise ValueError("wire event envelope conflicts with immutable part identity")


def _verify_payload(
    claim: IngestionPartPublicationClaim,
    payload: dict[str, Any],
) -> None:
    part = claim.part
    batch = claim.batch
    expected = {
        "batchId": str(batch.batch_id),
        "partId": str(part.message_id),
        "partKind": part.part_kind,
        "partIndex": part.part_index,
        "partCount": part.part_count,
        "versions": {
            "stagingSchema": part.versions.staging_schema,
            "packing": part.versions.packing,
            "eventContract": part.versions.event_contract,
        },
    }
    for key, value in expected.items():
        if payload.get(key) != value:
            raise ValueError(f"wire payload {key} conflicts with immutable part")
    source = payload.get("source")
    if not isinstance(source, dict):
        raise ValueError("wire payload source must be an object")
    coordinates = {
        "kind": batch.source_kind,
        "ownerId": batch.owner_id,
        "postId": batch.post_id,
        "pageOffset": batch.page_offset,
    }
    for key, value in coordinates.items():
        if source.get(key) != value:
            raise ValueError(f"wire source {key} conflicts with staged batch")
