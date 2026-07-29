#!/usr/bin/env python3
"""Validate JSON examples against the generated vk.execution.requested schema."""
from __future__ import annotations

import json
import sys
from pathlib import Path

import jsonschema
from parsevk_contracts.generation.json_schema import generate_json_schema
from parsevk_contracts.vk.commands import VK_EXECUTION_REQUESTED


def main() -> int:
    schema = generate_json_schema(VK_EXECUTION_REQUESTED)
    examples_dir = Path("examples/vk.execution.requested/v1")

    validator = jsonschema.Draft202012Validator(
        schema,
        format_checker=jsonschema.FormatChecker(),
    )

    failures = 0

    for example in sorted(examples_dir.glob("valid-*.json")):
        with open(example, encoding="utf-8") as fh:
            instance = json.load(fh)
        try:
            validator.validate(instance)
        except jsonschema.ValidationError as exc:
            print(f"  FAIL {example.name}: {exc.message}", file=sys.stderr)
            failures += 1
            continue
        print(f"  PASS {example.name}")

    for example in sorted(examples_dir.glob("invalid-schema-*.json")):
        with open(example, encoding="utf-8") as fh:
            instance = json.load(fh)
        try:
            validator.validate(instance)
            print(f"  FAIL {example.name}: expected schema error but got none", file=sys.stderr)
            failures += 1
        except jsonschema.ValidationError:
            print(f"  PASS {example.name} (expectedly rejected by schema)")

    if failures:
        print(f"\n{len(failures)} validation failure(s)", file=sys.stderr)
        return 1

    print("All example fixtures validated successfully")
    return 0


if __name__ == "__main__":
    sys.exit(main())
