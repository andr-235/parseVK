from __future__ import annotations

import json
from hashlib import sha256
from typing import Any

from common.events import WireEvent


def validate_source(
    source: dict[str, Any],
    post: dict[str, Any],
    part_kind: str,
    comments: tuple[dict[str, Any], ...],
) -> None:
    expected_kind = "post_snapshot" if part_kind == "post" else "comment_page"
    if source.get("kind") != expected_kind or int(source.get("pageOffset", -1)) < 0:
        raise ValueError("source position conflicts with part kind")
    if int(post.get("owner_id", 0)) != int(source.get("ownerId", 0)):
        raise ValueError("post owner conflicts with source position")
    if int(post.get("id", 0)) != int(source.get("postId", 0)):
        raise ValueError("post id conflicts with source position")
    if part_kind == "post" and comments:
        raise ValueError("post-only part contains comments")


def expected_part_digest(
    event: WireEvent,
    source: dict[str, Any],
    comments: tuple[dict[str, Any], ...],
    authors: tuple[dict[str, Any], ...],
    wire_digest: str,
    wire_bytes: int,
) -> str:
    owner_id = int(source["ownerId"])
    post_id = int(source["postId"])
    if event.payload["partKind"] == "post":
        items = [f"post:{owner_id}:{post_id}"]
    else:
        items = _comment_manifest(comments)
    manifest = {
        "messageId": str(event.event_id),
        "batchId": str(event.payload["batchId"]),
        "partKind": event.payload["partKind"],
        "partIndex": event.payload["partIndex"],
        "partCount": event.payload["partCount"],
        "versions": event.payload["versions"],
        "items": items,
        "authors": sorted(int(author["vkAuthorId"]) for author in authors),
        "preparedAt": event.created_at,
        "wireDigest": wire_digest,
        "wireBytes": wire_bytes,
    }
    encoded = json.dumps(
        manifest,
        ensure_ascii=False,
        allow_nan=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return sha256(encoded).hexdigest()


def _comment_manifest(comments: tuple[dict[str, Any], ...]) -> list[str]:
    identities: list[str] = []
    for comment in comments:
        identities.append(f"comment:{int(comment['id'])}")
        thread = comment.get("thread")
        children = thread.get("items") or [] if isinstance(thread, dict) else []
        identities.extend(_comment_manifest(tuple(dict(child) for child in children)))
    if len(identities) != len(set(identities)):
        raise ValueError("duplicate comment identities in staged part")
    return identities
