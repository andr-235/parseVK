"""Deterministic snapshot hashing shared by freeze and backfill."""

import json
from typing import Any


def canonical_json(value: Any) -> str:
    """Deterministic JSON: sorted keys, compact separators."""
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def snapshot_sha256(value: Any) -> str:
    """Stable content hash over canonical JSON (see libs/py/common/security)."""
    from common.security import stable_sha256

    return stable_sha256(canonical_json(value))
