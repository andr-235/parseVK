"""Manifest generation for the contract catalog."""

from __future__ import annotations

import json
from pathlib import Path

from parsevk_contracts.catalog import ContractCatalog


def generate_manifest(catalog: ContractCatalog) -> dict[str, object]:
    """Generate a deterministic manifest of all registered contracts."""
    contracts_list: list[dict[str, object]] = []

    # Collect all contracts sorted by message_type then schema_version
    all_contracts = sorted(
        catalog._contracts,
        key=lambda c: (c.message_type, c.schema_version),
    )

    for contract in all_contracts:
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
        if contract.partition_key is not None:
            entry["partitionKey"] = {
                "paths": list(contract.partition_key.paths),
                "separator": contract.partition_key.separator,
            }
        contracts_list.append(entry)

    return {
        "$schema": "parsevk-contracts-manifest",
        "version": 1,
        "contracts": contracts_list,
    }


def write_manifest(
    catalog: ContractCatalog,
    output_dir: Path,
) -> Path:
    """Generate and write the manifest file.

    Returns the path to the written file.
    """
    manifest = generate_manifest(catalog)
    output_dir.mkdir(parents=True, exist_ok=True)
    path = output_dir / "manifest.json"
    with open(path, "w") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False, sort_keys=True)
        f.write("\n")
    return path
