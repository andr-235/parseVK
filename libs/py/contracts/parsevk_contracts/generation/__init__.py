"""Schema generation entrypoint."""

from __future__ import annotations

import shutil
from pathlib import Path

from parsevk_contracts.catalog import ContractCatalog
from parsevk_contracts.generation.asyncapi import write_asyncapi
from parsevk_contracts.generation.json_schema import write_json_schema
from parsevk_contracts.generation.manifest import write_manifest


def generate_all(
    catalog: ContractCatalog,
    output_dir: str | Path = "generated",
) -> dict[str, list[str]]:
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    schema_dir = output_path / "json-schema"
    if schema_dir.exists():
        shutil.rmtree(schema_dir)
    schema_dir.mkdir(parents=True)
    generated: dict[str, list[str]] = {
        "json_schema": [],
        "manifest": [],
        "asyncapi": [],
    }
    for contract in catalog.contracts:
        generated["json_schema"].append(
            str(write_json_schema(contract, schema_dir))
        )
    generated["manifest"].append(str(write_manifest(catalog, output_path)))
    generated["asyncapi"].append(str(write_asyncapi(catalog, output_path)))
    return generated
