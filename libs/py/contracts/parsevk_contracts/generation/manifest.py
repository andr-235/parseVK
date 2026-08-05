"""Manifest generation for semantic message contracts."""

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
    metadata = metadata or ManifestMetadata()
    return {
        "package": {
            "name": metadata.package,
            "version": metadata.package_version,
            "repository": metadata.repository,
        },
        "contracts": [
            _contract_entry(contract)
            for contract in sorted(
                catalog.contracts,
                key=lambda item: item.message_type,
            )
        ],
    }


def _contract_entry(contract: MessageContract) -> dict[str, object]:
    entry: dict[str, object] = {
        "messageType": contract.message_type,
        "topic": contract.topic,
        "producers": sorted(contract.producers),
        "consumers": sorted(contract.consumers),
        "correlationRequired": contract.correlation_required,
        "causationPolicy": contract.causation_policy,
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
    path = output_dir / "manifest.json"
    text = json.dumps(
        generate_manifest(catalog, metadata),
        indent=2,
        ensure_ascii=False,
        sort_keys=True,
    ) + "\n"
    path.write_text(text, encoding="utf-8")
    return path
