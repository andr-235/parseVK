"""Repository-layout rules for unversioned semantic contracts."""

from __future__ import annotations

import re
from pathlib import Path

TEXT_SUFFIXES = frozenset({".py", ".json", ".yaml", ".yml"})
FORBIDDEN_MARKERS = ("schemaVersion", "schema_version")
VERSION_DIRECTORY = re.compile(r"^v\d+$", re.IGNORECASE)
NUMERIC_SCHEMA_FILE = re.compile(r"^\d+\.json$")
VERSIONED_MESSAGE_NAME = re.compile(r"(?:^|[._/-])v\d+(?:$|[._/-])", re.IGNORECASE)
LEGACY_ADAPTER_PACKAGE = "compati" + "bility"


def validate_unversioned_layout(root: Path) -> tuple[str, ...]:
    """Return deterministic violations for executable contract artifacts."""
    violations: list[str] = []
    legacy_package = root / "parsevk_contracts" / LEGACY_ADAPTER_PACKAGE
    if legacy_package.exists():
        violations.append("legacy contract adapter package must not exist")

    for directory_name in ("parsevk_contracts", "generated", "examples"):
        directory = root / directory_name
        if not directory.exists():
            violations.append(f"required contract directory is missing: {directory_name}")
            continue
        for path in sorted(directory.rglob("*")):
            relative = path.relative_to(root)
            if path.is_dir():
                if VERSION_DIRECTORY.fullmatch(path.name):
                    violations.append(f"numeric version directory is forbidden: {relative}")
                continue
            if NUMERIC_SCHEMA_FILE.fullmatch(path.name):
                violations.append(f"numeric schema filename is forbidden: {relative}")
            if path.suffix not in TEXT_SUFFIXES:
                continue
            try:
                text = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue
            for marker in FORBIDDEN_MARKERS:
                if marker in text:
                    violations.append(f"legacy marker {marker!r} is forbidden: {relative}")

    manifest = root / "generated" / "manifest.json"
    if manifest.is_file():
        import json

        payload = json.loads(manifest.read_text(encoding="utf-8"))
        for contract in payload.get("contracts", []):
            message_type = str(contract.get("messageType") or "")
            if not message_type:
                violations.append("manifest contract has empty messageType")
            elif VERSIONED_MESSAGE_NAME.search(message_type):
                violations.append(
                    "numeric message-type versions are forbidden: "
                    f"{message_type}"
                )

    return tuple(sorted(set(violations)))
