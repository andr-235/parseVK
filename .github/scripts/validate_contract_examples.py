#!/usr/bin/env python3
"""Validate flat, unversioned contract examples against generated schemas."""

from __future__ import annotations

import json
import sys
from dataclasses import dataclass
from pathlib import Path

import jsonschema
from parsevk_contracts.catalog import ContractCatalog
from parsevk_contracts.errors import ContractError
from parsevk_contracts.sources import SOURCES_CATALOG
from parsevk_contracts.validation import parse_for_consume
from parsevk_contracts.vk import VK_CATALOG


@dataclass(frozen=True, slots=True)
class Boundary:
    catalog: ContractCatalog
    consumer: str


BOUNDARIES = {
    "sources.": Boundary(SOURCES_CATALOG, "vk-service"),
    "vk.": Boundary(VK_CATALOG, "vk-service"),
}


def boundary_for(message_type: str) -> Boundary:
    for prefix, boundary in BOUNDARIES.items():
        if message_type.startswith(prefix):
            return boundary
    raise ValueError(f"No consume boundary configured for {message_type}")


def main() -> int:
    repo_root = Path(__file__).resolve().parents[2]
    contracts_root = repo_root / "libs/py/contracts"
    examples_root = contracts_root / "examples"
    schemas_root = contracts_root / "generated/json-schema"

    example_dirs = sorted(path for path in examples_root.iterdir() if path.is_dir())
    if not example_dirs:
        print("No contract example directories found", file=sys.stderr)
        return 1

    failures = 0
    validated = 0

    for example_dir in example_dirs:
        message_type = example_dir.name
        schema_path = schemas_root / f"{message_type}.json"
        examples = sorted(example_dir.glob("*.json"))

        if not schema_path.is_file():
            print(
                f"  FAIL {message_type}: missing schema {schema_path.name}",
                file=sys.stderr,
            )
            failures += 1
            continue
        if not examples:
            print(f"  FAIL {message_type}: no examples found", file=sys.stderr)
            failures += 1
            continue

        try:
            boundary = boundary_for(message_type)
            contract = boundary.catalog.get(message_type)
        except (ValueError, ContractError) as exc:
            print(f"  FAIL {message_type}: {exc}", file=sys.stderr)
            failures += 1
            continue

        schema = json.loads(schema_path.read_text(encoding="utf-8"))
        validator = jsonschema.Draft202012Validator(
            schema,
            format_checker=jsonschema.FormatChecker(),
        )

        for example_path in examples:
            try:
                instance = json.loads(example_path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError) as exc:
                print(f"  FAIL {example_path}: invalid JSON: {exc}", file=sys.stderr)
                failures += 1
                continue

            if instance.get("messageType") != message_type:
                print(
                    f"  FAIL {example_path}: messageType must equal {message_type}",
                    file=sys.stderr,
                )
                failures += 1
                continue
            if "schemaVersion" in instance:
                print(
                    f"  FAIL {example_path}: schemaVersion is forbidden",
                    file=sys.stderr,
                )
                failures += 1
                continue

            try:
                validator.validate(instance)
                parse_for_consume(
                    boundary.catalog,
                    consumer=boundary.consumer,
                    topic=contract.topic,
                    value=json.dumps(instance).encode("utf-8"),
                )
            except (jsonschema.ValidationError, ContractError) as exc:
                detail = exc.message if isinstance(exc, jsonschema.ValidationError) else str(exc)
                print(f"  FAIL {example_path}: {detail}", file=sys.stderr)
                failures += 1
                continue

            print(f"  PASS {example_path.relative_to(examples_root)}")
            validated += 1

    if failures:
        print(f"\n{failures} validation failure(s)", file=sys.stderr)
        return 1
    if not validated:
        print("No examples were validated", file=sys.stderr)
        return 1

    print(f"Validated {validated} unversioned contract example(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
