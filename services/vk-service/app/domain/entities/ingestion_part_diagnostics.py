from dataclasses import dataclass
from datetime import datetime
from uuid import UUID, uuid5

from app.domain.entities.ingestion_part_identity import IngestionPartVersions

DIAGNOSTIC_NAMESPACE = UUID("92c6bf2c-a397-4e70-a883-ff654b24228e")


@dataclass(frozen=True, slots=True)
class OversizedIngestionDiagnostic:
    diagnostic_id: UUID
    batch_id: UUID
    item_kind: str
    item_identity: str
    versions: IngestionPartVersions
    wire_bytes_count: int
    hard_limit_bytes: int
    reason: str
    created_at: datetime
    status: str = "quarantined"

    @classmethod
    def create(
        cls,
        *,
        batch_id: UUID,
        item_kind: str,
        item_identity: str,
        versions: IngestionPartVersions,
        wire_bytes_count: int,
        hard_limit_bytes: int,
        reason: str,
        created_at: datetime,
    ) -> "OversizedIngestionDiagnostic":
        if item_kind not in {"post", "comment"}:
            raise ValueError("unsupported oversized item kind")
        if wire_bytes_count <= hard_limit_bytes or hard_limit_bytes < 1:
            raise ValueError("oversized diagnostic requires bytes above the hard limit")
        if created_at.tzinfo is None:
            raise ValueError("diagnostic timestamp must be timezone-aware")
        diagnostic_id = uuid5(
            DIAGNOSTIC_NAMESPACE,
            f"{batch_id}:{item_kind}:{item_identity}:{versions.identity}",
        )
        return cls(
            diagnostic_id=diagnostic_id,
            batch_id=batch_id,
            item_kind=item_kind,
            item_identity=item_identity,
            versions=versions,
            wire_bytes_count=wire_bytes_count,
            hard_limit_bytes=hard_limit_bytes,
            reason=reason,
            created_at=created_at,
        )
