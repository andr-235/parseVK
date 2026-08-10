from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha256
from typing import Any
from uuid import UUID, uuid5

from common.events import WireEvent

from app.modules.ingestion.contract_digest import expected_part_digest, validate_source

PART_NAMESPACE = UUID("29bd8c2b-3941-492f-98ca-b67940412054")
POST_EVENT = "vk.ingestion.post-part-prepared"
COMMENT_EVENT = "vk.ingestion.comment-part-prepared"
SOURCE_SERVICE = "vk-service"
SUPPORTED_VERSIONS = (1, 1, 1)


class IngressValidationError(ValueError):
    """The staged message is not a valid immutable ingestion part."""


@dataclass(frozen=True, slots=True)
class PartVersions:
    staging_schema: int
    packing: int
    event_contract: int

    @property
    def identity(self) -> str:
        return f"{self.staging_schema}:{self.packing}:{self.event_contract}"


@dataclass(frozen=True, slots=True)
class IngestionPartEnvelope:
    event: WireEvent
    source_service: str
    batch_id: UUID
    part_kind: str
    part_index: int
    part_count: int
    versions: PartVersions
    source: dict[str, Any]
    post: dict[str, Any]
    comments: tuple[dict[str, Any], ...]
    authors: tuple[dict[str, Any], ...]
    page_digest: str
    part_digest: str
    wire_digest: str
    wire_bytes: int

    @property
    def source_message_id(self) -> UUID:
        return self.event.event_id


def parse_ingestion_part(
    raw_value: bytes,
    headers: list[tuple[str, bytes | None]] | None,
) -> IngestionPartEnvelope:
    try:
        event = WireEvent.model_validate_json(raw_value)
    except Exception as error:
        raise IngressValidationError("invalid staged ingestion envelope") from error
    event_kind = {POST_EVENT: "post", COMMENT_EVENT: "comments"}.get(event.event_type)
    if event_kind is None or event.aggregate_type != "vk_ingestion_batch":
        raise IngressValidationError("unsupported staged ingestion event")
    try:
        payload = event.payload
        batch_id = UUID(str(payload["batchId"]))
        part_id = UUID(str(payload["partId"]))
        version_data = payload["versions"]
        versions = PartVersions(
            int(version_data["stagingSchema"]),
            int(version_data["packing"]),
            int(version_data["eventContract"]),
        )
        part_kind = str(payload["partKind"])
        part_index = int(payload["partIndex"])
        part_count = int(payload["partCount"])
        source = dict(payload["source"])
        post = dict(payload["post"])
        comments = tuple(dict(item) for item in payload["comments"])
        authors = tuple(dict(item) for item in payload["authors"])
        validate_source(source, post, part_kind, comments)
    except (KeyError, TypeError, ValueError) as error:
        raise IngressValidationError(str(error) or "invalid staged part metadata") from error
    if (versions.staging_schema, versions.packing, versions.event_contract) != SUPPORTED_VERSIONS:
        raise IngressValidationError("unsupported staged part version tuple")
    if event.event_version != versions.event_contract:
        raise IngressValidationError("event version conflicts with part version")
    if part_id != event.event_id or str(batch_id) != event.aggregate_id:
        raise IngressValidationError("envelope identity conflicts with payload")
    if part_kind != event_kind or part_count < 1 or not 0 <= part_index < part_count:
        raise IngressValidationError("invalid staged part position")
    expected_id = uuid5(PART_NAMESPACE, f"{batch_id}:{part_kind}:{versions.identity}:{part_index}")
    if event.event_id != expected_id:
        raise IngressValidationError("staged part id is not deterministic")
    header_map = _headers(headers)
    source_service = _required_header(header_map, "source-service")
    if source_service != SOURCE_SERVICE:
        raise IngressValidationError("unexpected staged source service")
    _match_header(header_map, "event-id", str(event.event_id))
    _match_header(header_map, "event-type", event.event_type)
    _match_header(header_map, "batch-id", str(batch_id))
    wire_digest = sha256(raw_value).hexdigest()
    _match_header(header_map, "wire-digest", wire_digest)
    page_digest = _digest_header(header_map, "page-digest")
    part_digest = _digest_header(header_map, "part-digest")
    try:
        expected_digest = expected_part_digest(
            event, source, comments, authors, wire_digest, len(raw_value)
        )
    except (KeyError, TypeError, ValueError) as error:
        raise IngressValidationError(str(error)) from error
    if part_digest != expected_digest:
        raise IngressValidationError("part digest mismatch")
    return IngestionPartEnvelope(
        event, source_service, batch_id, part_kind, part_index, part_count, versions,
        source, post, comments, authors, page_digest, part_digest, wire_digest, len(raw_value)
    )


def _headers(headers: list[tuple[str, bytes | None]] | None) -> dict[str, str]:
    return {key: value.decode("utf-8") for key, value in headers or [] if value is not None}


def _required_header(headers: dict[str, str], name: str) -> str:
    value = headers.get(name)
    if not value:
        raise IngressValidationError(f"missing required header: {name}")
    return value


def _match_header(headers: dict[str, str], name: str, expected: str) -> None:
    if _required_header(headers, name) != expected:
        raise IngressValidationError(f"header mismatch: {name}")


def _digest_header(headers: dict[str, str], name: str) -> str:
    value = _required_header(headers, name).lower()
    if len(value) != 64 or any(char not in "0123456789abcdef" for char in value):
        raise IngressValidationError(f"invalid digest header: {name}")
    return value
