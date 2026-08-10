from datetime import UTC

from app.domain.entities.ingestion_part_publication import (
    IngestionPartPublicationClaim,
)
from app.domain.entities.ingestion_staging import StagedIngestionBatch
from app.domain.repositories.ingestion_part_publication import (
    IngestionPartPublicationIntegrityError,
)
from app.domain.repositories.ingestion_parts import IngestionPartIntegrityError
from app.infrastructure.db.models.ingestion_part_publication import (
    VkIngestionPartReference,
)
from app.infrastructure.db.models.ingestion_parts import VkIngestionStagingPart
from app.infrastructure.db.models.ingestion_staging import VkIngestionStagingBatch
from app.infrastructure.db.repositories.ingestion_part_records import part_from_model


def claim_from_models(
    reference: VkIngestionPartReference,
    part_model: VkIngestionStagingPart,
    batch_model: VkIngestionStagingBatch,
) -> IngestionPartPublicationClaim:
    if (
        reference.claim_id is None
        or reference.claimed_by is None
        or reference.claim_expires_at is None
    ):
        raise IngestionPartPublicationIntegrityError(
            "publication reference does not contain a complete claim"
        )
    lease_expires_at = reference.claim_expires_at
    if lease_expires_at.tzinfo is None:
        lease_expires_at = lease_expires_at.replace(tzinfo=UTC)
    try:
        return IngestionPartPublicationClaim(
            claim_id=reference.claim_id,
            worker_id=reference.claimed_by,
            lease_expires_at=lease_expires_at,
            attempts=reference.attempts,
            batch=batch_from_model(batch_model),
            part=part_from_model(part_model),
        ).verified_copy()
    except (ValueError, IngestionPartIntegrityError) as error:
        raise IngestionPartPublicationIntegrityError(str(error)) from error


def batch_from_model(model: VkIngestionStagingBatch) -> StagedIngestionBatch:
    staged_at = model.created_at
    if staged_at.tzinfo is None:
        staged_at = staged_at.replace(tzinfo=UTC)
    batch = StagedIngestionBatch(
        batch_id=model.id,
        execution_id=model.execution_id,
        staged_by_attempt_id=model.staged_by_attempt_id,
        staged_by_fencing_token=model.staged_by_fencing_token,
        source_kind=model.source_kind,
        owner_id=model.owner_id,
        post_id=model.post_id,
        page_offset=model.page_offset,
        payload=dict(model.payload),
        payload_digest=model.payload_digest,
        payload_bytes=model.payload_bytes,
        staged_at=staged_at,
        status=model.status,
    )
    try:
        return batch.verified_copy()
    except ValueError as error:
        raise IngestionPartPublicationIntegrityError(str(error)) from error
