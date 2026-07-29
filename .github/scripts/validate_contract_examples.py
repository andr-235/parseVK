#!/usr/bin/env python3
"""Validate JSON examples against the generated vk.execution.requested schema."""
from __future__ import annotations

import json
import sys
from pathlib import Path

import jsonschema
from parsevk_contracts.errors import ContractError
from parsevk_contracts.generation.json_schema import generate_json_schema
from parsevk_contracts.validation import parse_for_consume
from parsevk_contracts.vk import VK_CATALOG
from parsevk_contracts.vk.commands import VK_EXECUTION_REQUESTED


def main() -> int:
    schema = generate_json_schema(VK_EXECUTION_REQUESTED)
    repo_root = Path(__file__).resolve().parents[2]
    examples_dir = repo_root / "libs/py/contracts/examples" / "vk.execution.requested" / "v1"

    validator = jsonschema.Draft202012Validator(
        schema,
        format_checker=jsonschema.FormatChecker(),
    )

    failures = 0

    all_json: list[Path] = sorted(examples_dir.glob("*.json"))
    known_prefixes = frozenset({"valid", "consume", "invalid-schema", "invalid-contract"})

    for path in all_json:
        stem = path.stem
        prefix = stem.split("-")[0] if "-" in stem else stem
        if prefix == "invalid":
            prefix = "invalid-schema" if "schema" in stem else "invalid-contract"
        if prefix not in known_prefixes:
            print(f"  FAIL {path.name}: unknown prefix (expected one of: {', '.join(sorted(known_prefixes))})", file=sys.stderr)
            failures += 1

    valid_examples = sorted(examples_dir.glob("valid-*.json"))
    consume_examples = sorted(examples_dir.glob("consume-*.json"))
    invalid_schema_examples = sorted(examples_dir.glob("invalid-schema-*.json"))
    invalid_contract_examples = sorted(examples_dir.glob("invalid-contract-*.json"))

    if not valid_examples:
        print("No valid examples found", file=sys.stderr)
        return 1

    if not consume_examples:
        print("No consume examples found", file=sys.stderr)
        return 1

    if not invalid_schema_examples:
        print("No invalid schema examples found", file=sys.stderr)
        return 1

    if not invalid_contract_examples:
        print("No invalid contract examples found", file=sys.stderr)
        return 1

    for example in valid_examples:
        with open(example, encoding="utf-8") as fh:
            instance = json.load(fh)
        try:
            validator.validate(instance)
        except jsonschema.ValidationError as exc:
            print(f"  FAIL {example.name}: {exc.message}", file=sys.stderr)
            failures += 1
            continue
        print(f"  PASS {example.name}")

    for example in consume_examples:
        with open(example, encoding="utf-8") as fh:
            instance = json.load(fh)
        try:
            parse_for_consume(
                VK_CATALOG,
                consumer="vk-service",
                topic="parsevk.vk.commands",
                value=json.dumps(instance).encode("utf-8"),
            )
        except ContractError as exc:
            print(f"  FAIL {example.name}: {exc}", file=sys.stderr)
            failures += 1
            continue
        print(f"  PASS {example.name}")

    for example in invalid_schema_examples:
        with open(example, encoding="utf-8") as fh:
            instance = json.load(fh)
        try:
            validator.validate(instance)
            print(f"  FAIL {example.name}: expected schema error but got none", file=sys.stderr)
            failures += 1
        except jsonschema.ValidationError:
            print(f"  PASS {example.name} (expectedly rejected by schema)")

    # Cross-validate: schema-only rejects must also pass contract check
    # to ensure the schema + contract stay in sync on envelope-level constraints
    for example in invalid_schema_examples:
        with open(example, encoding="utf-8") as fh:
            instance = json.load(fh)
        try:
            parse_for_consume(
                VK_CATALOG,
                consumer="vk-service",
                topic="parsevk.vk.commands",
                value=json.dumps(instance).encode("utf-8"),
            )
            print(f"  INFO {example.name}: passes contract (schema-only rejection)")
        except ContractError:
            print(f"  INFO {example.name}: also rejected by contract (consistent)")

    for example in invalid_contract_examples:
        with open(example, encoding="utf-8") as fh:
            instance = json.load(fh)
        try:
            parse_for_consume(
                VK_CATALOG,
                consumer="vk-service",
                topic="parsevk.vk.commands",
                value=json.dumps(instance).encode("utf-8"),
            )
            print(f"  FAIL {example.name}: expected contract error but got none", file=sys.stderr)
            failures += 1
        except ContractError:
            print(f"  PASS {example.name} (expectedly rejected by contract)")

    if failures:
        print(f"\n{failures} validation failure(s)", file=sys.stderr)
        return 1

    print("All example fixtures validated successfully")
    return 0


if __name__ == "__main__":
    sys.exit(main())
