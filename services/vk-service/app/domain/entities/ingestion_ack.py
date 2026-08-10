from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any
from uuid import UUID

from common.events import WireEvent

ACK_EVENT_TYPE = "content.ingestion.part-applied"
SOURCE_SERVICE = "vk-service"
_HEX = frozenset("0123456789abcdef")


@dataclass(frozen=True, slots=True)
class IngestionAckVersions:
    staging_schema: int
    packing: int
    event_contract: int

    def __post_init__(self) -> None:
        if min(self.staging_schema, self.packing, self.event_contract) < 1:
            raise ValueError("ACK versions must be positive")


@dataclass(frozen=True, slots=True)
class IngestionPartAppliedAck:
    ack_event_id: UUID
    source_message_id: UUID
    batch_id: UUID
    part_kind: str
    part_index: int
    part_count: int
    versions: IngestionAckVersions
    source_position: dict[str, Any]
    page_digest: str
    part_digest: str
    wire_digest: str
    receipt_id: UUID
    applied_at: datetime
    effect_summary: dict[str, Any]

    @classmethod
    def from_event(cls, event: WireEvent) -> IngestionPartAppliedAck:
        if event.event_type != ACK_EVENT_TYPE or event.event_version != 1:
            raise ValueError("unsupported ingestion ACK event")
        if event.aggregate_type != "vk_ingestion_part":
            raise ValueError("ingestion ACK aggregate type mismatch")
        payload = event.payload
        try:
            if payload["sourceService"] != SOURCE_SERVICE:
                raise ValueError("unexpected ingestion ACK source service")
            source_message_id = UUID(str(payload["sourceMessageId"]))
            if event.aggregate_id != str(source_message_id):
                raise ValueError("ingestion ACK aggregate identity mismatch")
            batch_id = UUID(str(payload["batchId"]))
            part_kind = str(payload["partKind"])
            part_index = int(payload["partIndex"])
            part_count = int(payload["partCount"])
            versions_payload = payload["versions"]
            versions = IngestionAckVersions(
                staging_schema=int(versions_payload["stagingSchema"]),
                packing=int(versions_payload["packing"]),
                event_contract=int(versions_payload["eventContract"]),
            )
            source_position = dict(payload["sourcePosition"])
            page_digest = _digest(payload["pageDigest"], "pageDigest")
            part_digest = _digest(payload["partDigest"], "partDigest")
            wire_digest = _digest(payload["wireDigest"], "wireDigest")
            receipt_id = UUID(str(payload["receiptId"]))
            applied_at = datetime.fromisoformat(str(payload["appliedAt"]).replace("Z", "+00:00"))
            effect_summary = dict(payload["effectSummary"])
        except (KeyError, TypeError, ValueError) as error:
            raise ValueError("invalid ingestion ACK payload") from error
        if part_kind not in {"post", "comments"}:
            raise ValueError("unsupported ingestion ACK part kind")
        if part_count < 1 or not 0 <= part_index < part_count:
            raise ValueError("invalid ingestion ACK part position")
        if applied_at.tzinfo is None:
            raise ValueError("ingestion ACK appliedAt must be timezone-aware")
        _validate_source_position(source_position, part_kind)
        return cls(
            ack_event_id=event.event_id,
            source_message_id=source_message_id,
            batch_id=batch_id,
            part_kind=part_kind,
            part_index=part_index,
            part_count=part_count,
            versions=versions,
            source_position=source_position,
            page_digest=page_digest,
            part_digest=part_digest,
            wire_digest=wire_digest,
            receipt_id=receipt_id,
            applied_at=applied_at,
            effect_summary=effect_summary,
        )


def _digest(value: object, name: str) -> str:
    digest = str(value).lower()
    if len(digest) != 64 or any(char not in _HEX for char in digest):
        raise ValueError(f"invalid ingestion ACK {name}")
    return digest


def _validate_source_position(source: dict[str, Any], part_kind: str) -> None:
    expected_kind = "post_snapshot" if part_kind == "post" else "comment_page"
    try:
        if source["kind"] != expected_kind:
            raise ValueError("ingestion ACK source kind mismatch")
        int(source["ownerId"])
        int(source["postId"])
        page_offset = int(source["pageOffset"])
    except (KeyError, TypeError, ValueError) as error:
        raise ValueError("invalid ingestion ACK source position") from error
    if page_offset < 0:
        raise ValueError("ingestion ACK page offset must be non-negative")
