"""JSON Schema generation for contract payloads."""

from __future__ import annotations

import json
from pathlib import Path

from parsevk_contracts.catalog import MessageContract
from parsevk_contracts.envelope import MessageEnvelope


def generate_json_schema(contract: MessageContract) -> dict[str, object]:
    """Generate a JSON Schema (Draft 2020-12) for a contract's envelope + payload.

    Uses Pydantic's native ``model_json_schema()`` with ``by_alias=True``
    so the schema uses camelCase property names matching the wire format.
    Post-processes the schema to add contract identity constraints.
    """
    envelope_type = MessageEnvelope[contract.payload_model]  # type: ignore[name-defined]
    schema = envelope_type.model_json_schema(by_alias=True, mode="validation")

    schema["$schema"] = "https://json-schema.org/draft/2020-12/schema"
    schema["$id"] = f"urn:parsevk:contract:{contract.message_type}:{contract.schema_version}"
    schema["title"] = contract.message_type
    schema["description"] = f"Schema for {contract.message_type} v{contract.schema_version}"

    properties = schema.get("properties", {})

    # Fix messageType to const
    if "messageType" in properties:
        properties["messageType"] = {"const": contract.message_type}

    # Fix schemaVersion to const
    if "schemaVersion" in properties:
        properties["schemaVersion"] = {"const": contract.schema_version}

    # Fix producer to enum
    if "producer" in properties:
        properties["producer"] = {"enum": sorted(contract.producers)}

    # Envelope policy constraints
    required: list[str] = list(schema.get("required", []))

    if contract.correlation_required and "correlationId" not in required:
        required.append("correlationId")

    if contract.causation_policy == "forbidden" and "causationId" in properties:
        properties["causationId"] = {"type": "null"}

    if contract.causation_policy == "required":
        if "causationId" not in required:
            required.append("causationId")
        if "causationId" in properties:
            properties["causationId"] = {
                "oneOf": [
                    {"type": "null"},
                    {"type": "string", "format": "uuid"},
                ]
            }

    if required:
        schema["required"] = required

    return schema


def write_json_schema(
    contract: MessageContract,
    output_dir: Path,
) -> Path:
    """Generate and write a JSON Schema file for a contract.

    Returns the path to the written file.
    """
    schema = generate_json_schema(contract)
    contract_dir = output_dir / contract.message_type
    contract_dir.mkdir(parents=True, exist_ok=True)
    path = contract_dir / f"{contract.schema_version}.json"
    with open(path, "w") as f:
        json.dump(schema, f, indent=2, ensure_ascii=False, sort_keys=True)
        f.write("\n")
    return path
