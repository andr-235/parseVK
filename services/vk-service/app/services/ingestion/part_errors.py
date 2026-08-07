from dataclasses import dataclass
from uuid import UUID

from app.domain.entities.ingestion_part_identity import IngestionPartVersions


@dataclass(frozen=True, slots=True)
class OversizedIngestionItemError(ValueError):
    batch_id: UUID
    item_kind: str
    item_identity: str
    wire_bytes_count: int
    hard_limit_bytes: int
    versions: IngestionPartVersions

    def __str__(self) -> str:
        return (
            f"{self.item_kind} {self.item_identity} requires "
            f"{self.wire_bytes_count} bytes; hard limit is {self.hard_limit_bytes}; "
            f"versions={self.versions.identity}"
        )
