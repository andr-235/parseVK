from datetime import UTC

from app.domain.entities.ingestion_part_identity import IngestionPartVersions
from app.domain.entities.ingestion_parts import IngestionPart
from app.domain.repositories.ingestion_parts import IngestionPartIntegrityError
from app.infrastructure.db.models.ingestion_parts import VkIngestionStagingPart


def part_values(part: IngestionPart) -> dict:
    verified = verified_part(part)
    return {
        "id": verified.message_id,
        "batch_id": verified.batch_id,
        "part_kind": verified.part_kind,
        "part_index": verified.part_index,
        "part_count": verified.part_count,
        "staging_schema_version": verified.versions.staging_schema,
        "packing_version": verified.versions.packing,
        "event_contract_version": verified.versions.event_contract,
        "item_manifest": list(verified.item_manifest),
        "author_manifest": list(verified.author_manifest),
        "prepared_at": verified.prepared_at,
        "part_digest": verified.part_digest,
        "wire_bytes": verified.wire_bytes,
        "wire_bytes_count": verified.wire_bytes_count,
        "wire_digest": verified.wire_digest,
        "status": verified.status,
    }


def part_from_model(model: VkIngestionStagingPart) -> IngestionPart:
    prepared_at = model.prepared_at
    if prepared_at.tzinfo is None:
        prepared_at = prepared_at.replace(tzinfo=UTC)
    part = IngestionPart(
        message_id=model.id,
        batch_id=model.batch_id,
        part_kind=model.part_kind,
        part_index=model.part_index,
        part_count=model.part_count,
        versions=IngestionPartVersions(
            staging_schema=model.staging_schema_version,
            packing=model.packing_version,
            event_contract=model.event_contract_version,
        ),
        item_manifest=tuple(str(value) for value in model.item_manifest),
        author_manifest=tuple(int(value) for value in model.author_manifest),
        prepared_at=prepared_at,
        part_digest=model.part_digest,
        wire_bytes=bytes(model.wire_bytes),
        wire_bytes_count=model.wire_bytes_count,
        wire_digest=model.wire_digest,
        status=model.status,
    )
    return verified_part(part)


def verified_part(part: IngestionPart) -> IngestionPart:
    try:
        return part.verified_copy()
    except ValueError as error:
        raise IngestionPartIntegrityError(str(error)) from error
