from dataclasses import dataclass
from uuid import UUID, uuid5

PART_NAMESPACE = UUID("29bd8c2b-3941-492f-98ca-b67940412054")
POST_PART = "post"
COMMENT_PART = "comments"
PART_KINDS = frozenset({POST_PART, COMMENT_PART})
PACKING_TARGET_BYTES = 512 * 1024
APPLICATION_HARD_LIMIT_BYTES = 768 * 1024


@dataclass(frozen=True, slots=True)
class IngestionPartVersions:
    staging_schema: int = 1
    packing: int = 1
    event_contract: int = 1

    def __post_init__(self) -> None:
        if min(self.staging_schema, self.packing, self.event_contract) < 1:
            raise ValueError("ingestion part versions must be positive")

    @property
    def identity(self) -> str:
        return f"{self.staging_schema}:{self.packing}:{self.event_contract}"


def deterministic_part_id(
    *,
    batch_id: UUID,
    part_kind: str,
    versions: IngestionPartVersions,
    part_index: int,
) -> UUID:
    if part_kind not in PART_KINDS:
        raise ValueError(f"unsupported ingestion part kind: {part_kind}")
    if part_index < 0:
        raise ValueError("part_index must be non-negative")
    return uuid5(
        PART_NAMESPACE,
        f"{batch_id}:{part_kind}:{versions.identity}:{part_index}",
    )
