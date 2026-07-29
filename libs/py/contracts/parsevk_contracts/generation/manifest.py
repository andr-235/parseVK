"""Manifest generation for contract packages."""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from parsevk_contracts.vk.commands import CATALOG


@dataclass(frozen=True)
class ManifestMetadata:
    repository: str = "github.com/andr-235/parseVK"
    package: str = "parsevk-contracts"
    package_version: str = "0.1.0"


def generate_manifest(
    metadata: ManifestMetadata | None = None,
) -> dict[str, object]:
    """Generate a contract manifest listing all registered contracts."""
    metadata = metadata or ManifestMetadata()
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "urn:parsevk:manifest:1",
        "title": "parseVK Contract Manifest",
        "description": "Registry of all message contracts in the parseVK platform",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "metadata": {
            "repository": metadata.repository,
            "package": metadata.package,
            "package_version": metadata.package_version,
        },
        "contracts": sorted(
            [
{
                        "message_type": c.message_type,
                        "schema_version": c.schema_version,
                        "topic": c.topic,
                        "producers": sorted(c.producers),
                        "consumers": sorted(c.consumers),
                        "partition_key": list(c.partition_key.paths) if c.partition_key is not None else None,
                    }
                for c in CATALOG.contracts
            ],
            key=lambda c: c["message_type"],
        ),
    }


def write_manifest(
    output_dir: Path,
    metadata: ManifestMetadata | None = None,
) -> Path:
    """Generate and write the contract manifest."""
    manifest = generate_manifest(metadata)
    path = output_dir / "manifest.json"
    with open(path, "w") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False, sort_keys=True)
        f.write("\n")
    return path
