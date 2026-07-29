"""AsyncAPI 3.1 generation for the contract catalog."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml  # type: ignore[import-untyped]

from parsevk_contracts.catalog import ContractCatalog


def generate_asyncapi(catalog: ContractCatalog) -> dict[str, object]:
    """Generate an AsyncAPI 3.1 document from the contract catalog."""
    channels: dict[str, dict[str, Any]] = {}
    messages: dict[str, dict[str, Any]] = {}

    for contract in sorted(
        catalog._contracts,
        key=lambda c: (c.message_type, c.schema_version),
    ):
        message_name = contract.message_type.replace(".", "_")

        # Build message entry
        messages[message_name] = {
            "name": contract.message_type,
            "title": contract.message_type,
            "summary": f"{contract.message_type} v{contract.schema_version}",
            "contentType": "application/json",
            "payload": {
                "$ref": f"../json-schema/{contract.message_type}/{contract.schema_version}.json",
            },
        }

        # Build channel entry
        channel_name = contract.topic.replace(".", "_")
        if channel_name not in channels:
            channels[channel_name] = {
                "address": contract.topic,
                "messages": {},
            }
        channels[channel_name]["messages"][message_name] = {
            "$ref": f"#/components/messages/{message_name}",
        }

    result: dict[str, object] = {
        "asyncapi": "3.1.0",
        "info": {
            "title": "ParseVK Contracts",
            "version": "1.0.0",
            "description": "AsyncAPI specification for ParseVK Kafka message contracts",
        },
        "defaultContentType": "application/json",
        "channels": channels,
        "components": {
            "messages": messages,
        },
    }
    return result


def write_asyncapi(
    catalog: ContractCatalog,
    output_dir: Path,
) -> Path:
    """Generate and write the AsyncAPI YAML file.

    Returns the path to the written file.
    """
    asyncapi_dir = output_dir / "asyncapi"
    asyncapi_dir.mkdir(parents=True, exist_ok=True)
    path = asyncapi_dir / "parsevk-contracts.yaml"

    document = generate_asyncapi(catalog)
    with open(path, "w") as f:
        yaml.dump(document, f, default_flow_style=False, sort_keys=False, allow_unicode=True)

    return path
