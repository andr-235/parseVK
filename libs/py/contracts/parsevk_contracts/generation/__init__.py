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

    json_schema_dir = output_path / "json-schema"
    generated: dict[str, list[str]] = {
        "json_schema": [],
        "manifest": [],
        "asyncapi": [],
    }

    # Generate JSON Schema for each contract
    for contract in catalog._contracts:
        path = write_json_schema(contract, json_schema_dir)
        generated["json_schema"].append(str(path))

    # Generate manifest
    manifest_path = write_manifest(catalog, output_path)
    generated["manifest"].append(str(manifest_path))

    # Generate AsyncAPI
    asyncapi_path = write_asyncapi(catalog, output_path)
    generated["asyncapi"].append(str(asyncapi_path))

    return generated
