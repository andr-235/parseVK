"""JSON Schema generation for semantic message contracts."""

from __future__ import annotations

import json
from pathlib import Path

from parsevk_contracts.catalog import MessageContract
from parsevk_contracts.envelope import MessageEnvelope


def generate_json_schema(contract: MessageContract) -> dict[str, object]:
    envelope_type = MessageEnvelope[contract.payload_model]  # type: ignore[name-defined]
    schema = envelope_type.model_json_schema(by_alias=True, mode="validation")
    schema["$schema"] = "https://json-schema.org/draft/2020-12/schema"
    schema["$id"] = f"urn:parsevk:contract:{contract.message_type}"
    schema["title"] = contract.message_type
    schema["description"] = f"Schema for {contract.message_type}"
    properties = schema.get("properties", {})
    if "messageType" in properties:
        properties["messageType"] = {"const": contract.message_type}
    if "producer" in properties:
        properties["producer"] = {"enum": sorted(contract.producers)}
    required: list[str] = list(schema.get("required", []))
    if contract.correlation_required:
        if "correlationId" not in required:
            required.append("correlationId")
        properties["correlationId"] = {
            "type": "string",
            "format": "uuid",
        }
    if contract.causation_policy == "forbidden" and "causationId" in properties:
        properties["causationId"] = {"type": "null"}
    if contract.causation_policy == "required":
        if "causationId" not in required:
            required.append("causationId")
        properties["causationId"] = {
            "type": "string",
            "format": "uuid",
        }
    if required:
        schema["required"] = required
    return schema


def write_json_schema(contract: MessageContract, output_dir: Path) -> Path:
    schema = generate_json_schema(contract)
    output_dir.mkdir(parents=True, exist_ok=True)
    path = output_dir / f"{contract.message_type}.json"
    text = json.dumps(schema, indent=2, ensure_ascii=False, sort_keys=True) + "\n"
    path.write_text(text, encoding="utf-8")
    return path
