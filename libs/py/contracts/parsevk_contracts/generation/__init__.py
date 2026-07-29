"""Schema generation (JSON Schema, manifest, AsyncAPI)."""

from __future__ import annotations

from pathlib import Path

from parsevk_contracts.catalog import ContractCatalog
from parsevk_contracts.generation.asyncapi import write_asyncapi
from parsevk_contracts.generation.json_schema import write_json_schema
from parsevk_contracts.generation.manifest import write_manifest


def generate_all(
    catalog: ContractCatalog,
    output_dir: str | Path = "generated",
) -> dict[str, list[str]]:
    """Run all generators and return paths of created files."""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    generated: dict[str, list[str]] = {
        "json_schema": [],
        "manifest": [],
        "asyncapi": [],
    }

    for contract in catalog.contracts:
        path = write_json_schema(contract, output_path)
        generated["json_schema"].append(str(path))

    manifest_path = write_manifest(catalog, output_path)
    generated["manifest"].append(str(manifest_path))

    asyncapi_path = write_asyncapi(catalog, output_path)
    generated["asyncapi"].append(str(asyncapi_path))

    return generated
