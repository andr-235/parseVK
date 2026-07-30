from __future__ import annotations

import json
from pathlib import Path

from parsevk_contracts.compatibility.models import CompatibilityCheckError


def load_manifest(path: Path) -> dict[str, object]:
    """Load and validate a manifest.json file with strict typed validation."""
    if not path.exists():
        raise CompatibilityCheckError(f"Manifest not found: {path}")
    try:
        data = json.loads(path.read_bytes())
    except json.JSONDecodeError as exc:
        raise CompatibilityCheckError(
            f"Manifest is not valid JSON: {path}: {exc}"
        ) from exc
    if not isinstance(data, dict):
        raise CompatibilityCheckError(
            f"Manifest root must be a JSON object: {path}"
        )
    contracts = data.get("contracts")
    if not isinstance(contracts, list):
        raise CompatibilityCheckError(
            f"Manifest must contain a 'contracts' array: {path}"
        )
    seen_identities: set[tuple[str, int]] = set()
    for i, entry in enumerate(contracts):
        if not isinstance(entry, dict):
            raise CompatibilityCheckError(
                f"Manifest contract entry {i} is not a JSON object: {path}"
            )

        mt = entry.get("messageType")
        sv = entry.get("schemaVersion")

        if not isinstance(mt, str) or not mt:
            raise CompatibilityCheckError(
                f"Manifest contract entry {i}: 'messageType' must be a non-empty string, got {mt!r}: {path}"
            )
        if isinstance(sv, bool) or not isinstance(sv, int) or sv < 1:
            raise CompatibilityCheckError(
                f"Manifest contract entry {i}: 'schemaVersion' must be int >= 1, got {sv!r}: {path}"
            )

        identity = (mt, sv)
        if identity in seen_identities:
            raise CompatibilityCheckError(
                f"Manifest contract entry {i}: duplicate identity '{mt}' v{sv}: {path}"
            )
        seen_identities.add(identity)

        for fname, ftype in (("topic", str), ("producers", list), ("consumers", list)):
            val = entry.get(fname)
            if val is not None and not isinstance(val, ftype):
                raise CompatibilityCheckError(
                    f"Manifest contract entry {i}: '{fname}' must be {ftype.__name__}, got {type(val).__name__}: {path}"
                )

    return data