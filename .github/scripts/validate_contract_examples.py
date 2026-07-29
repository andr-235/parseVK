#!/usr/bin/env python3
"""Validate JSON examples against the generated vk.execution.requested schema."""

import json
from pathlib import Path

import jsonschema
from parsevk_contracts.generation.json_schema import generate_json_schema
from parsevk_contracts.vk.commands import VK_EXECUTION_REQUESTED


def main() -> None:
    schema = generate_json_schema(VK_EXECUTION_REQUESTED)
    examples_dir = Path("examples/vk.execution.requested/v1")
    for example in sorted(examples_dir.glob("valid-*.json")):
        with open(example, encoding="utf-8") as fh:
            instance = json.load(fh)
        jsonschema.validate(instance, schema)
        print(f"  ✓ {example.name}")
    print("All valid examples pass schema validation")


if __name__ == "__main__":
    main()
