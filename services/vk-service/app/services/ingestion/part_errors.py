from dataclasses import dataclass
from uuid import UUID


@dataclass(frozen=True, slots=True)
class OversizedIngestionItemError(ValueError):
    batch_id: UUID
    item_kind: str
    item_identity: str
    wire_bytes_count: int
    hard_limit_bytes: int

    def __str__(self) -> str:
        return (
            f"{self.item_kind} {self.item_identity} requires "
            f"{self.wire_bytes_count} bytes; hard limit is {self.hard_limit_bytes}"
        )
