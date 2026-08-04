import hashlib
import json
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class CollectionIdentity:
    provider_account_key: str
    source_key: str
    fingerprint: str
    normalized_plan: dict[str, Any]


def build_collection_identity(
    *,
    provider_account_key: str,
    source_provider: str,
    source_type: str,
    source_external_id: str,
    source_owner_id: int,
    post_strategy: str,
    post_limit: int,
    comment_mode: str,
    include_thread_replies: bool,
) -> CollectionIdentity:
    """Build identity strictly from one physical source and its collection plan."""

    source_key = f"{source_provider}:{source_type}:{source_external_id}"
    normalized_plan: dict[str, Any] = {
        "providerAccountKey": provider_account_key,
        "source": {
            "provider": source_provider,
            "sourceType": source_type,
            "externalId": str(source_external_id),
            "ownerId": int(source_owner_id),
        },
        "postSelection": {
            "strategy": post_strategy,
            "limitPerSource": int(post_limit),
        },
        "commentSelection": {
            "mode": comment_mode,
            "includeThreadReplies": bool(include_thread_replies),
        },
    }
    serialized = json.dumps(
        normalized_plan,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return CollectionIdentity(
        provider_account_key=provider_account_key,
        source_key=source_key,
        fingerprint=hashlib.sha256(serialized).hexdigest(),
        normalized_plan=normalized_plan,
    )
