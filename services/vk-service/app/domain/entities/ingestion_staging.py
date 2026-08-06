from __future__ import annotations

import json
from collections.abc import Mapping
from dataclasses import dataclass, replace
from hashlib import sha256
from typing import Any
from uuid import UUID, uuid5

STAGING_BATCH_NAMESPACE = UUID("659168a2-aabb-4b95-8f6f-96b2714f4d4e")


def canonical_payload(payload: Mapping[str, Any]) -> tuple[dict[str, Any], str, int]:
    """Return JSON-normalized payload, SHA-256 digest and exact UTF-8 byte size."""
    try:
        encoded = json.dumps(
            payload,
            ensure_ascii=False,
            allow_nan=False,
            sort_keys=True,
            separators=(",", ":"),
        ).encode("utf-8")
    except (TypeError, ValueError) as error:
        raise ValueError("staging payload must be finite JSON data") from error
    normalized = json.loads(encoded)
    if not isinstance(normalized, dict):
        raise ValueError("staging payload must be a JSON object")
    return normalized, sha256(encoded).hexdigest(), len(encoded)


def deterministic_batch_id(
    *,
    execution_id: UUID,
    source_kind: str,
    owner_id: int,
    post_id: int,
    page_offset: int,
) -> UUID:
    if not source_kind or len(source_kind) > 32:
        raise ValueError("source_kind must contain 1..32 characters")
    if page_offset < 0:
        raise ValueError("page_offset must be non-negative")
    identity = f"{execution_id}:{source_kind}:{owner_id}:{post_id}:{page_offset}"
    return uuid5(STAGING_BATCH_NAMESPACE, identity)


@dataclass(frozen=True, slots=True)
class StagedIngestionBatch:
    batch_id: UUID
    execution_id: UUID
    staged_by_attempt_id: UUID
    staged_by_fencing_token: int
    source_kind: str
    owner_id: int
    post_id: int
    page_offset: int
    payload: dict[str, Any]
    payload_digest: str
    payload_bytes: int
    status: str = "staged"

    @classmethod
    def create(
        cls,
        *,
        execution_id: UUID,
        attempt_id: UUID,
        fencing_token: int,
        source_kind: str,
        owner_id: int,
        post_id: int,
        page_offset: int,
        payload: Mapping[str, Any],
    ) -> StagedIngestionBatch:
        if fencing_token < 1:
            raise ValueError("fencing_token must be positive")
        normalized, digest, byte_count = canonical_payload(payload)
        return cls(
            batch_id=deterministic_batch_id(
                execution_id=execution_id,
                source_kind=source_kind,
                owner_id=owner_id,
                post_id=post_id,
                page_offset=page_offset,
            ),
            execution_id=execution_id,
            staged_by_attempt_id=attempt_id,
            staged_by_fencing_token=fencing_token,
            source_kind=source_kind,
            owner_id=owner_id,
            post_id=post_id,
            page_offset=page_offset,
            payload=normalized,
            payload_digest=digest,
            payload_bytes=byte_count,
        )

    def verified_copy(self) -> StagedIngestionBatch:
        """Return an isolated canonical copy after rechecking identity and bytes."""
        if self.staged_by_fencing_token < 1:
            raise ValueError("staging fencing token must remain positive")
        expected_id = deterministic_batch_id(
            execution_id=self.execution_id,
            source_kind=self.source_kind,
            owner_id=self.owner_id,
            post_id=self.post_id,
            page_offset=self.page_offset,
        )
        if self.batch_id != expected_id:
            raise ValueError("staging batch id no longer matches its source position")

        normalized, digest, byte_count = canonical_payload(self.payload)
        if digest != self.payload_digest or byte_count != self.payload_bytes:
            raise ValueError("staging payload no longer matches its digest and byte count")
        return replace(self, payload=normalized)
