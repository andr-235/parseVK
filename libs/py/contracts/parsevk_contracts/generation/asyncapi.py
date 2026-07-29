"""AsyncAPI 3.1 generation for the contract catalog."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml  # type: ignore[import-untyped]

from parsevk_contracts.catalog import ContractCatalog


PACKAGE_NAME = "parsevk-contracts"
PACKAGE_VERSION = "0.1.0"


def _message_name(contract: ContractCatalog.contracts) -> str:  # type: ignore[arg-type]
    """Generate a versioned message component name."""
    return f"{contract.message_type.replace('.', '_')}_v{contract.schema_version}"


def generate_asyncapi(catalog: ContractCatalog) -> dict[str, object]:
    """Generate an AsyncAPI 3.1 document from the contract catalog."""
    channels: dict[str, dict[str, Any]] = {}
    messages: dict[str, dict[str, Any]] = {}
    operations: dict[str, dict[str, Any]] = {}

    for contract in sorted(
        catalog.contracts,
        key=lambda c: (c.message_type, c.schema_version),
    ):
        msg_name = _message_name(contract)

        messages[msg_name] = {
            "name": contract.message_type,
            "title": contract.message_type,
            "summary": f"{contract.message_type} v{contract.schema_version}",
            "contentType": "application/json",
            "payload": {
                "$ref": f"../json-schema/{contract.message_type}/{contract.schema_version}.json",
            },
        }

        channel_name = contract.topic.replace(".", "_")
        if channel_name not in channels:
            channels[channel_name] = {
                "address": contract.topic,
                "messages": {},
            }
        channels[channel_name]["messages"][msg_name] = {
            "$ref": f"#/components/messages/{msg_name}",
        }

        # Operations per producer
        for producer in sorted(contract.producers):
            op_name_send = f"{producer.replace('-', '_')}_send_{msg_name}"
            operations[op_name_send] = {
                "action": "send",
                "channel": {
                    "$ref": f"#/channels/{channel_name}",
                },
                "messages": [
                    {"$ref": f"#/components/messages/{msg_name}"},
                ],
            }

        # Operations per consumer
        for consumer in sorted(contract.consumers):
            op_name_recv = f"{consumer.replace('-', '_')}_receive_{msg_name}"
            operations[op_name_recv] = {
                "action": "receive",
                "channel": {
                    "$ref": f"#/channels/{channel_name}",
                },
                "messages": [
                    {"$ref": f"#/components/messages/{msg_name}"},
                ],
            }

    result: dict[str, object] = {
        "asyncapi": "3.1.0",
        "info": {
            "title": "ParseVK Contracts",
            "version": PACKAGE_VERSION,
            "description": "AsyncAPI specification for ParseVK Kafka message contracts",
        },
        "defaultContentType": "application/json",
        "channels": channels,
        "operations": operations,
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
