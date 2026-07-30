"""Manifest generation for contract packages."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

from parsevk_contracts._metadata import PACKAGE_NAME, PACKAGE_VERSION
from parsevk_contracts.catalog import ContractCatalog, MessageContract


@dataclass(frozen=True, slots=True)
class ManifestMetadata:
    repository: str = "github.com/andr-235/parseVK"
    package: str = PACKAGE_NAME
    package_version: str = PACKAGE_VERSION


def generate_manifest(
    catalog: ContractCatalog,
    metadata: ManifestMetadata | None = None,
) -> dict[str, object]:
    """Generate a contract manifest listing all registered contracts."""
    metadata = metadata or ManifestMetadata()
    contracts = [
        _contract_entry(c)
        for c in sorted(
            catalog.contracts,
            key=lambda c: (c.message_type, c.schema_version),
        )
    ]
    return {
        "manifestVersion": 1,
        "package": {
            "name": metadata.package,
            "version": metadata.package_version,
            "repository": metadata.repository,
        },
        "contracts": contracts,
    }


def _contract_entry(contract: MessageContract) -> dict[str, object]:
    """Build a manifest entry for a single contract."""
    entry: dict[str, object] = {
        "messageType": contract.message_type,
        "schemaVersion": contract.schema_version,
        "topic": contract.topic,
        "producers": sorted(contract.producers),
        "consumers": sorted(contract.consumers),
        "correlationRequired": contract.correlation_required,
        "causationPolicy": contract.causation_policy,
        "compatibility": contract.compatibility,
    }
    if contract.correlation_path is not None:
        entry["correlationPath"] = contract.correlation_path
    if contract.partition_key is not None:
        entry["partitionKey"] = {
            "paths": list(contract.partition_key.paths),
            "separator": contract.partition_key.separator,
        }
    return entry


def write_manifest(
    catalog: ContractCatalog,
    output_dir: Path,
    metadata: ManifestMetadata | None = None,
) -> Path:
    """Generate and write the contract manifest."""
    manifest = generate_manifest(catalog, metadata)
    path = output_dir / "manifest.json"
    text = json.dumps(manifest, indent=2, ensure_ascii=False, sort_keys=True) + "\n"
    path.write_bytes(text.encode("utf-8"))
    return path
