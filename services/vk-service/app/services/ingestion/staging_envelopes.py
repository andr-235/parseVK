from typing import Any

from app.services.ingestion.staging_payload import stable_entities


def post_snapshot_payload(
    *,
    schema_version: int,
    source_kind: str,
    owner_id: int,
    post_id: int,
    post: dict[str, Any],
    authors: list[dict[str, Any]],
) -> dict[str, Any]:
    return {
        "schemaVersion": schema_version,
        "source": {
            "kind": source_kind,
            "ownerId": owner_id,
            "postId": post_id,
            "pageOffset": 0,
            "nextOffset": None,
        },
        "observed": {
            "post": dict(post),
            "authors": stable_entities(authors),
        },
        "providerMetadata": {},
    }


def comment_page_payload(
    *,
    schema_version: int,
    source_kind: str,
    owner_id: int,
    post_id: int,
    page: dict[str, Any],
    page_offset: int,
    next_offset: int,
) -> dict[str, Any]:
    return {
        "schemaVersion": schema_version,
        "source": {
            "kind": source_kind,
            "ownerId": owner_id,
            "postId": post_id,
            "pageOffset": page_offset,
            "nextOffset": next_offset,
        },
        "observed": {
            "post": dict(page["post"]),
            "comments": [dict(item) for item in page.get("items") or []],
            "profiles": stable_entities(page.get("profiles")),
            "groups": stable_entities(page.get("groups")),
        },
        "providerMetadata": {
            key: value
            for key, value in page.items()
            if key not in {"post", "items", "profiles", "groups"}
        },
    }
