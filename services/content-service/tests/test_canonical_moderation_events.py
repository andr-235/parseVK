from __future__ import annotations

from dataclasses import replace
from datetime import UTC, datetime
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from ingestion_application_fakes import part

from app.modules.ingestion.canonical_events import (
    CANONICAL_COMMENTS_CHUNK_SIZE,
    build_canonical_moderation_manifest,
)


def test_canonical_comment_chunking_is_deterministic() -> None:
    comments = tuple(
        {
            "id": comment_id,
            "owner_id": -10,
            "post_id": 20,
            "from_id": 30,
            "date": 1_700_000_000 + comment_id,
            "text": f"comment-{comment_id}",
        }
        for comment_id in range(CANONICAL_COMMENTS_CHUNK_SIZE + 1, 0, -1)
    )
    ingestion_part = replace(part(), comments=comments)
    created_at = datetime(2026, 8, 9, tzinfo=UTC)

    first = build_canonical_moderation_manifest(
        ingestion_part,
        created_at=created_at,
        post_revision=7,
    )
    second = build_canonical_moderation_manifest(
        ingestion_part,
        created_at=created_at,
        post_revision=7,
    )

    assert first == second
    assert len(first["events"]) == 2
    assert len(first["events"][0]["payload"]["comments"]) == 250
    assert len(first["events"][1]["payload"]["comments"]) == 1
    assert first["events"][0]["payload"]["postRevision"] == 7
    assert first["events"][0]["payload"]["chunkIndex"] == 0
    assert first["events"][1]["payload"]["chunkIndex"] == 1
    assert all(
        event["payload"]["chunkCount"] == 2
        for event in first["events"]
    )
    ordered_ids = [
        comment["commentId"]
        for event in first["events"]
        for comment in event["payload"]["comments"]
    ]
    assert ordered_ids == list(range(1, CANONICAL_COMMENTS_CHUNK_SIZE + 2))
